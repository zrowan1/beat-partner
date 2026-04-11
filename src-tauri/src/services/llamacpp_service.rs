use crate::error::{BeatPartnerError, Result};
use crate::models::{ChatMessage, ChatResponse, LlamaCppModel, LlamaCppStatus};
use futures::stream::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::sync::mpsc;

pub struct LlamaCppService {
    base_url: String,
    client: Client,
}

// Request types
#[derive(Serialize)]
struct LlamaCppChatRequest {
    model: String,
    messages: Vec<LlamaCppMessage>,
    stream: bool,
}

#[derive(Serialize)]
struct LlamaCppMessage {
    role: String,
    content: String,
}

// Response types for /v1/models
#[derive(Deserialize)]
struct OpenAIModelsResponse {
    data: Vec<OpenAIModelObject>,
}

#[derive(Deserialize)]
struct OpenAIModelObject {
    id: String,
    owned_by: Option<String>,
}

// Response types for streaming chat (SSE, OpenAI-compatible format)
#[derive(Deserialize)]
struct OpenAIStreamChunk {
    choices: Vec<OpenAIChoice>,
}

#[derive(Deserialize)]
struct OpenAIChoice {
    delta: Option<OpenAIDelta>,
    #[allow(dead_code)]
    finish_reason: Option<String>,
}

#[derive(Deserialize)]
struct OpenAIDelta {
    content: Option<String>,
}

// Response from /health endpoint
#[derive(Deserialize)]
struct LlamaCppHealthResponse {
    status: String,
}

impl LlamaCppService {
    pub fn new(base_url: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(300))
            .build()
            .unwrap_or_default();

        Self { base_url, client }
    }

    /// Check if a llama-server is running at the configured base URL.
    /// Never returns Err for connectivity failures — callers check `.available`.
    pub async fn check_status(&self) -> Result<LlamaCppStatus> {
        let url = format!("{}/health", self.base_url);

        match self.client.get(&url).send().await {
            Ok(response) => {
                let http_status = response.status();

                // HTTP 503 = model is still loading — server is up but not ready
                if http_status == reqwest::StatusCode::SERVICE_UNAVAILABLE {
                    return Ok(LlamaCppStatus {
                        available: false,
                        model_loaded: None,
                        error: Some("Model loading, please wait...".to_string()),
                    });
                }

                if http_status.is_success() {
                    // Try to parse the health body; tolerate parse failures
                    let status_text = response
                        .json::<LlamaCppHealthResponse>()
                        .await
                        .map(|r| r.status)
                        .unwrap_or_else(|_| "ok".to_string());

                    if status_text == "ok" || status_text == "no slot available" {
                        // Attempt to find the loaded model name
                        let model_loaded = self
                            .list_models()
                            .await
                            .ok()
                            .and_then(|m| m.into_iter().next())
                            .map(|m| m.id);

                        Ok(LlamaCppStatus {
                            available: true,
                            model_loaded,
                            error: None,
                        })
                    } else {
                        Ok(LlamaCppStatus {
                            available: false,
                            model_loaded: None,
                            error: Some(format!("Unexpected health status: {}", status_text)),
                        })
                    }
                } else {
                    Ok(LlamaCppStatus {
                        available: false,
                        model_loaded: None,
                        error: Some(format!("llama-server returned HTTP {}", http_status)),
                    })
                }
            }
            Err(e) => Ok(LlamaCppStatus {
                available: false,
                model_loaded: None,
                error: Some(format!("Failed to connect to llama-server: {}", e)),
            }),
        }
    }

    /// List models loaded in the running llama-server (typically just one).
    pub async fn list_models(&self) -> Result<Vec<LlamaCppModel>> {
        let url = format!("{}/v1/models", self.base_url);

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| BeatPartnerError::AIService(format!("llama.cpp models request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(BeatPartnerError::AIService(format!(
                "llama.cpp /v1/models returned HTTP {}",
                response.status()
            )));
        }

        let data: OpenAIModelsResponse = response
            .json()
            .await
            .map_err(|e| BeatPartnerError::AIService(format!("Failed to parse models response: {}", e)))?;

        let models = data
            .data
            .into_iter()
            .map(|m| {
                let name = derive_display_name(&m.id);
                LlamaCppModel {
                    id: m.id,
                    name,
                    owned_by: m.owned_by.unwrap_or_else(|| "llamacpp".to_string()),
                }
            })
            .collect();

        Ok(models)
    }

    /// Stream a chat completion from the llama-server (OpenAI-compatible SSE).
    pub async fn chat_stream(
        &self,
        messages: Vec<ChatMessage>,
        model: &str,
        stream_tx: mpsc::Sender<String>,
    ) -> Result<ChatResponse> {
        let url = format!("{}/v1/chat/completions", self.base_url);

        let llama_messages: Vec<LlamaCppMessage> = messages
            .iter()
            .map(|m| LlamaCppMessage {
                role: m.role.clone(),
                content: m.content.clone(),
            })
            .collect();

        let request = LlamaCppChatRequest {
            model: model.to_string(),
            messages: llama_messages,
            stream: true,
        };

        let response = self
            .client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| BeatPartnerError::AIService(format!("llama.cpp chat request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown error".to_string());
            return Err(BeatPartnerError::AIService(format!(
                "llama.cpp returned {}: {}",
                status, body
            )));
        }

        let mut stream = response.bytes_stream();
        let mut full_content = String::new();

        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    let text = String::from_utf8_lossy(&bytes);
                    for line in text.lines() {
                        let line = line.trim();
                        if line.is_empty() || line == "data: [DONE]" {
                            continue;
                        }
                        if let Some(data) = line.strip_prefix("data: ") {
                            if let Ok(chunk) = serde_json::from_str::<OpenAIStreamChunk>(data) {
                                for choice in &chunk.choices {
                                    if let Some(ref delta) = choice.delta {
                                        if let Some(ref content) = delta.content {
                                            if !content.is_empty() {
                                                full_content.push_str(content);
                                                let _ = stream_tx.send(content.clone()).await;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    return Err(BeatPartnerError::AIService(format!(
                        "llama.cpp stream error: {}",
                        e
                    )));
                }
            }
        }

        Ok(ChatResponse {
            message: ChatMessage {
                role: "assistant".to_string(),
                content: full_content,
            },
            model: model.to_string(),
            done: true,
        })
    }
}

/// Derive a human-readable display name from a model path or id.
/// e.g. "/path/to/Llama-3.2-3B-Q4_K_M.gguf" → "Llama 3.2 3B Q4 K M"
fn derive_display_name(id: &str) -> String {
    let basename = id.rsplit('/').next().unwrap_or(id);
    let without_ext = basename.trim_end_matches(".gguf");
    without_ext.replace(['-', '_'], " ")
}
