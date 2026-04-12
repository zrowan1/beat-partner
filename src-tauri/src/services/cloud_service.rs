use crate::error::{BeatPartnerError, Result};
use crate::models::{ChatMessage, ChatResponse, OpenRouterModel, OpenRouterModelsResponse};
use crate::services::AIProvider;
use bytes::Bytes;
use futures::stream::StreamExt;
use reqwest::Client;
use std::time::Duration;
use tokio::sync::mpsc;

pub struct CloudService {
    client: Client,
}

// OpenAI-compatible request/response types
#[derive(serde::Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    stream: bool,
}

#[derive(serde::Serialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(serde::Deserialize)]
struct OpenAIStreamChunk {
    choices: Vec<OpenAIChoice>,
}

#[derive(serde::Deserialize)]
struct OpenAIChoice {
    delta: Option<OpenAIDelta>,
    #[allow(dead_code)]
    finish_reason: Option<String>,
}

#[derive(serde::Deserialize)]
struct OpenAIDelta {
    content: Option<String>,
}

// Anthropic request/response types
#[derive(serde::Serialize)]
struct AnthropicRequest {
    model: String,
    messages: Vec<AnthropicMessage>,
    max_tokens: u32,
    stream: bool,
}

#[derive(serde::Serialize)]
struct AnthropicMessage {
    role: String,
    content: String,
}

#[derive(serde::Deserialize)]
struct AnthropicStreamEvent {
    #[serde(rename = "type")]
    event_type: String,
    delta: Option<AnthropicDelta>,
}

#[derive(serde::Deserialize)]
struct AnthropicDelta {
    #[serde(rename = "type")]
    #[allow(dead_code)]
    delta_type: Option<String>,
    text: Option<String>,
}

impl CloudService {
    pub fn new(timeout_ms: u64) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_millis(timeout_ms))
            .build()
            .unwrap_or_default();

        Self { client }
    }

    pub async fn chat_stream(
        &self,
        provider: &AIProvider,
        model: String,
        messages: Vec<ChatMessage>,
        api_key: &str,
        base_url: Option<&str>,
        stream_tx: mpsc::Sender<String>,
    ) -> Result<ChatResponse> {
        match provider {
            AIProvider::OpenAI | AIProvider::Custom => {
                self.openai_chat_stream(model, messages, api_key, base_url, stream_tx)
                    .await
            }
            AIProvider::Anthropic => {
                self.anthropic_chat_stream(model, messages, api_key, stream_tx)
                    .await
            }
            AIProvider::OpenRouter => {
                self.openrouter_chat_stream(model, messages, api_key, stream_tx)
                    .await
            }
            _ => Err(BeatPartnerError::Config(format!(
                "Cloud streaming not supported for provider: {:?}",
                provider
            ))),
        }
    }

    async fn openai_chat_stream(
        &self,
        model: String,
        messages: Vec<ChatMessage>,
        api_key: &str,
        base_url: Option<&str>,
        stream_tx: mpsc::Sender<String>,
    ) -> Result<ChatResponse> {
        let url = format!(
            "{}/chat/completions",
            base_url.unwrap_or("https://api.openai.com/v1")
        );

        let openai_messages: Vec<OpenAIMessage> = messages
            .iter()
            .map(|m| OpenAIMessage {
                role: m.role.clone(),
                content: m.content.clone(),
            })
            .collect();

        let request = OpenAIRequest {
            model: model.clone(),
            messages: openai_messages,
            stream: true,
        };

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| BeatPartnerError::AIService(format!("OpenAI request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown error".to_string());
            return Err(BeatPartnerError::AIService(format!(
                "OpenAI returned {}: {}",
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
                            if let Ok(chunk) =
                                serde_json::from_str::<OpenAIStreamChunk>(data)
                            {
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
                        "OpenAI stream error: {}",
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
            model,
            done: true,
        })
    }

    async fn anthropic_chat_stream(
        &self,
        model: String,
        messages: Vec<ChatMessage>,
        api_key: &str,
        stream_tx: mpsc::Sender<String>,
    ) -> Result<ChatResponse> {
        let url = "https://api.anthropic.com/v1/messages";

        // Filter out system messages — Anthropic uses a separate system parameter
        let anthropic_messages: Vec<AnthropicMessage> = messages
            .iter()
            .filter(|m| m.role != "system")
            .map(|m| AnthropicMessage {
                role: m.role.clone(),
                content: m.content.clone(),
            })
            .collect();

        let request = AnthropicRequest {
            model: model.clone(),
            messages: anthropic_messages,
            max_tokens: 4096,
            stream: true,
        };

        let response = self
            .client
            .post(url)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                BeatPartnerError::AIService(format!("Anthropic request failed: {}", e))
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown error".to_string());
            return Err(BeatPartnerError::AIService(format!(
                "Anthropic returned {}: {}",
                status, body
            )));
        }

        let mut stream = response.bytes_stream();
        let mut full_content = String::new();

        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    Self::parse_anthropic_sse(&bytes, &mut full_content, &stream_tx).await;
                }
                Err(e) => {
                    return Err(BeatPartnerError::AIService(format!(
                        "Anthropic stream error: {}",
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
            model,
            done: true,
        })
    }

    async fn openrouter_chat_stream(
        &self,
        model: String,
        messages: Vec<ChatMessage>,
        api_key: &str,
        stream_tx: mpsc::Sender<String>,
    ) -> Result<ChatResponse> {
        let url = "https://openrouter.ai/api/v1/chat/completions";

        let openai_messages: Vec<OpenAIMessage> = messages
            .iter()
            .map(|m| OpenAIMessage {
                role: m.role.clone(),
                content: m.content.clone(),
            })
            .collect();

        let request = OpenAIRequest {
            model: model.clone(),
            messages: openai_messages,
            stream: true,
        };

        let response = self
            .client
            .post(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("HTTP-Referer", "https://beatpartner.app")
            .header("X-Title", "BeatPartner")
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                BeatPartnerError::AIService(format!("OpenRouter request failed: {}", e))
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown error".to_string());
            return Err(BeatPartnerError::AIService(format!(
                "OpenRouter returned {}: {}",
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
                        "OpenRouter stream error: {}",
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
            model,
            done: true,
        })
    }

    pub async fn fetch_openrouter_models(&self, api_key: &str) -> Result<Vec<OpenRouterModel>> {
        let url = "https://openrouter.ai/api/v1/models";

        let response = self
            .client
            .get(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| {
                BeatPartnerError::AIService(format!("OpenRouter models request failed: {}", e))
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown error".to_string());
            return Err(BeatPartnerError::AIService(format!(
                "OpenRouter returned {}: {}",
                status, body
            )));
        }

        let models_response: OpenRouterModelsResponse = response.json().await.map_err(|e| {
            BeatPartnerError::AIService(format!("Failed to parse OpenRouter models: {}", e))
        })?;

        Ok(models_response
            .data
            .into_iter()
            .map(|raw| raw.into_model())
            .collect())
    }

    async fn parse_anthropic_sse(
        bytes: &Bytes,
        full_content: &mut String,
        stream_tx: &mpsc::Sender<String>,
    ) {
        let text = String::from_utf8_lossy(bytes);
        for line in text.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            if let Some(data) = line.strip_prefix("data: ") {
                if let Ok(event) = serde_json::from_str::<AnthropicStreamEvent>(data) {
                    if event.event_type == "content_block_delta" {
                        if let Some(ref delta) = event.delta {
                            if let Some(ref text) = delta.text {
                                if !text.is_empty() {
                                    full_content.push_str(text);
                                    let _ = stream_tx.send(text.clone()).await;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
