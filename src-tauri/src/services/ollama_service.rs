use crate::error::{BeatPartnerError, Result};
use crate::models::{
    ChatMessage, ChatResponse, DownloadProgress, OllamaChatRequest, OllamaChatResponse,
    OllamaModel, OllamaPullProgress, OllamaPullRequest, OllamaStatus, OllamaTagResponse,
};
use bytes::Bytes;
use futures::stream::StreamExt;
use reqwest::{Client, StatusCode};
use std::time::{Duration, Instant};
use tokio::sync::mpsc;

pub struct OllamaService {
    client: Client,
    base_url: String,
}

impl OllamaService {
    pub fn new(base_url: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(300))
            .build()
            .unwrap_or_default();

        Self { client, base_url }
    }

    pub async fn check_status(&self) -> Result<OllamaStatus> {
        let url = format!("{}/api/version", self.base_url);
        
        match self.client.get(&url).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    let version = response.json::<serde_json::Value>().await
                        .ok()
                        .and_then(|v| v.get("version").and_then(|v| v.as_str()).map(String::from));
                    
                    Ok(OllamaStatus {
                        available: true,
                        version,
                        error: None,
                    })
                } else {
                    Ok(OllamaStatus {
                        available: false,
                        version: None,
                        error: Some(format!("Ollama returned status: {}", response.status())),
                    })
                }
            }
            Err(e) => Ok(OllamaStatus {
                available: false,
                version: None,
                error: Some(format!("Failed to connect to Ollama: {}", e)),
            }),
        }
    }

    pub async fn list_models(&self) -> Result<Vec<OllamaModel>> {
        let url = format!("{}/api/tags", self.base_url);
        
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| BeatPartnerError::AIService(format!("Failed to list models: {}", e)))?;

        if response.status() != StatusCode::OK {
            return Err(BeatPartnerError::AIService(format!(
                "Ollama returned status: {}",
                response.status()
            )));
        }

        let tag_response = response
            .json::<OllamaTagResponse>()
            .await
            .map_err(|e| BeatPartnerError::AIService(format!("Failed to parse models: {}", e)))?;

        let models: Vec<OllamaModel> = tag_response
            .models
            .into_iter()
            .map(|tag| {
                let size_gb = tag.size as f64 / 1024.0 / 1024.0 / 1024.0;
                let use_cases = Self::infer_use_cases(&tag.details.family, &tag.details.parameter_size);
                
                OllamaModel {
                    id: tag.name.clone(),
                    name: Self::format_model_name(&tag.name),
                    description: format!("{} model with {}", tag.details.family, tag.details.parameter_size),
                    size_gb,
                    parameter_count: tag.details.parameter_size.clone(),
                    use_cases,
                    quantization: tag.details.quantization_level.clone(),
                    installed: true,
                    downloaded_at: Some(tag.modified_at),
                    version: tag.digest[..16].to_string(),
                }
            })
            .collect();

        Ok(models)
    }

    pub async fn download_model(
        &self,
        model_id: String,
        progress_tx: mpsc::Sender<DownloadProgress>,
    ) -> Result<()> {
        let url = format!("{}/api/pull", self.base_url);
        
        let request = OllamaPullRequest {
            name: model_id.clone(),
            stream: true,
        };

        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| BeatPartnerError::AIService(format!("Failed to start download: {}", e)))?;

        if !response.status().is_success() {
            return Err(BeatPartnerError::AIService(format!(
                "Ollama returned status: {}",
                response.status()
            )));
        }

        let mut stream = response.bytes_stream();
        let start_time = Instant::now();
        let mut last_bytes: u64 = 0;
        let mut total_bytes: u64 = 0;

        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    if let Ok(progress) = Self::parse_pull_progress(&bytes) {
                        let current_bytes = progress.completed.unwrap_or(0);
                        total_bytes = progress.total.unwrap_or(total_bytes);

                        let elapsed_secs = start_time.elapsed().as_secs_f64();
                        let speed_mbps = if elapsed_secs > 0.0 {
                            ((current_bytes - last_bytes) as f64 / elapsed_secs) / 1024.0 / 1024.0
                        } else {
                            0.0
                        };

                        let percentage = if total_bytes > 0 {
                            (current_bytes as f64 / total_bytes as f64) * 100.0
                        } else {
                            0.0
                        };

                        let estimated_seconds = if speed_mbps > 0.0 && total_bytes > current_bytes {
                            ((total_bytes - current_bytes) as f64 / 1024.0 / 1024.0 / speed_mbps) as u64
                        } else {
                            0
                        };

                        let status = if progress.status == "success" || progress.status.contains("complete") {
                            "completed"
                        } else if progress.status.contains("verifying")
                            || progress.status.contains("writing")
                            || progress.status.contains("removing")
                        {
                            "verifying"
                        } else {
                            "downloading"
                        };

                        let is_completed = status == "completed";

                        let download_progress = DownloadProgress {
                            model_id: model_id.clone(),
                            status: status.to_string(),
                            bytes_downloaded: current_bytes,
                            bytes_total: total_bytes,
                            percentage,
                            speed_mbps,
                            estimated_seconds_remaining: estimated_seconds,
                            error: None,
                        };

                        let _ = progress_tx.send(download_progress).await;
                        last_bytes = current_bytes;

                        if is_completed {
                            return Ok(());
                        }
                    }
                }
                Err(e) => {
                    let error_progress = DownloadProgress {
                        model_id: model_id.clone(),
                        status: "error".to_string(),
                        bytes_downloaded: last_bytes,
                        bytes_total: total_bytes,
                        percentage: 0.0,
                        speed_mbps: 0.0,
                        estimated_seconds_remaining: 0,
                        error: Some(e.to_string()),
                    };
                    let _ = progress_tx.send(error_progress).await;
                    return Err(BeatPartnerError::AIService(format!("Download stream error: {}", e)));
                }
            }
        }

        // Stream ended without explicit "success" — send a final completed event
        let final_progress = DownloadProgress {
            model_id: model_id.clone(),
            status: "completed".to_string(),
            bytes_downloaded: total_bytes,
            bytes_total: total_bytes,
            percentage: 100.0,
            speed_mbps: 0.0,
            estimated_seconds_remaining: 0,
            error: None,
        };
        let _ = progress_tx.send(final_progress).await;

        Ok(())
    }

    pub async fn delete_model(&self, model_id: String) -> Result<()> {
        let url = format!("{}/api/delete", self.base_url);
        
        let request = serde_json::json!({
            "name": model_id
        });

        let response = self.client
            .delete(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| BeatPartnerError::AIService(format!("Failed to delete model: {}", e)))?;

        if !response.status().is_success() {
            return Err(BeatPartnerError::AIService(format!(
                "Ollama returned status: {}",
                response.status()
            )));
        }

        Ok(())
    }

    pub async fn chat_stream(
        &self,
        model: String,
        messages: Vec<ChatMessage>,
        stream_tx: mpsc::Sender<String>,
    ) -> Result<ChatResponse> {
        let url = format!("{}/api/chat", self.base_url);
        
        let request = OllamaChatRequest {
            model,
            messages,
            stream: true,
        };

        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| BeatPartnerError::AIService(format!("Failed to start chat: {}", e)))?;

        if !response.status().is_success() {
            return Err(BeatPartnerError::AIService(format!(
                "Ollama returned status: {}",
                response.status()
            )));
        }

        let mut stream = response.bytes_stream();
        let mut final_response: Option<ChatResponse> = None;

        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    if let Ok(chat_response) = Self::parse_chat_response(&bytes) {
                        let content = chat_response.message.content.clone();
                        
                        if !content.is_empty() {
                            let _ = stream_tx.send(content).await;
                        }

                        if chat_response.done {
                            final_response = Some(ChatResponse {
                                message: chat_response.message,
                                model: chat_response.model,
                                done: true,
                            });
                        }
                    }
                }
                Err(e) => {
                    return Err(BeatPartnerError::AIService(format!("Chat stream error: {}", e)));
                }
            }
        }

        final_response.ok_or_else(|| {
            BeatPartnerError::AIService("No response from Ollama".to_string())
        })
    }

    fn parse_pull_progress(bytes: &Bytes) -> Result<OllamaPullProgress> {
        let text = String::from_utf8_lossy(bytes);
        let lines: Vec<&str> = text.lines().collect();
        
        for line in lines {
            if let Ok(progress) = serde_json::from_str::<OllamaPullProgress>(line) {
                return Ok(progress);
            }
        }
        
        Err(BeatPartnerError::AIService("Failed to parse progress".to_string()))
    }

    fn parse_chat_response(bytes: &Bytes) -> Result<OllamaChatResponse> {
        let text = String::from_utf8_lossy(bytes);
        let lines: Vec<&str> = text.lines().collect();
        
        for line in lines {
            if let Ok(response) = serde_json::from_str::<OllamaChatResponse>(line) {
                return Ok(response);
            }
        }
        
        Err(BeatPartnerError::AIService("Failed to parse chat response".to_string()))
    }

    fn format_model_name(name: &str) -> String {
        name.split(':')
            .next()
            .unwrap_or(name)
            .split('-')
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + &chars.as_str().to_lowercase(),
                }
            })
            .collect::<Vec<String>>()
            .join(" ")
    }

    fn infer_use_cases(_family: &str, parameter_size: &str) -> Vec<crate::models::ModelUseCase> {
        use crate::models::ModelUseCase;
        
        let size_gb = if parameter_size.contains("3") {
            3.0
        } else if parameter_size.contains("7") || parameter_size.contains("8") {
            7.0
        } else if parameter_size.contains("14") {
            14.0
        } else if parameter_size.contains("32") || parameter_size.contains("70") {
            32.0
        } else {
            7.0
        };

        match size_gb {
            s if s < 4.0 => vec![ModelUseCase::General, ModelUseCase::Creative],
            s if s < 8.0 => vec![
                ModelUseCase::General,
                ModelUseCase::Theory,
                ModelUseCase::Production,
            ],
            s if s < 16.0 => vec![
                ModelUseCase::General,
                ModelUseCase::Theory,
                ModelUseCase::Production,
                ModelUseCase::Analysis,
                ModelUseCase::Mixing,
            ],
            _ => vec![
                ModelUseCase::Analysis,
                ModelUseCase::Mastering,
                ModelUseCase::SoundDesign,
                ModelUseCase::Theory,
            ],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_model_name() {
        assert_eq!(OllamaService::format_model_name("llama3.2:latest"), "Llama3.2");
        assert_eq!(OllamaService::format_model_name("mistral:7b"), "Mistral");
        assert_eq!(OllamaService::format_model_name("deepseek-r1:14b"), "Deepseek R1");
    }
}
