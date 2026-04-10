use crate::error::{BeatPartnerError, Result};
use crate::models::{ChatMessage, ChatResponse, OllamaModel};
use crate::services::OllamaService;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AIProvider {
    Ollama,
    OpenAI,
    Anthropic,
    Custom,
    Auto,
}

impl Default for AIProvider {
    fn default() -> Self {
        AIProvider::Auto
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    pub provider: AIProvider,
    pub preferred_local_model: String,
    pub preferred_cloud_model: String,
    pub cloud_api_key: Option<String>,
    pub cloud_base_url: Option<String>,
    pub ollama_base_url: String,
    pub timeout_ms: u64,
    pub max_retries: u32,
    pub stream_responses: bool,
}

impl Default for AIConfig {
    fn default() -> Self {
        Self {
            provider: AIProvider::Auto,
            preferred_local_model: "llama3.2".to_string(),
            preferred_cloud_model: "gpt-4o-mini".to_string(),
            cloud_api_key: None,
            cloud_base_url: None,
            ollama_base_url: "http://localhost:11434".to_string(),
            timeout_ms: 30000,
            max_retries: 3,
            stream_responses: true,
        }
    }
}

pub struct AIService {
    config: AIConfig,
    ollama: OllamaService,
}

impl AIService {
    pub fn new(config: AIConfig) -> Self {
        let ollama = OllamaService::new(config.ollama_base_url.clone());
        Self { config, ollama }
    }

    pub fn with_base_url(base_url: String) -> Self {
        let config = AIConfig {
            ollama_base_url: base_url,
            ..Default::default()
        };
        Self::new(config)
    }

    pub async fn chat(
        &self,
        messages: Vec<ChatMessage>,
        model: Option<String>,
        stream_tx: mpsc::Sender<String>,
    ) -> Result<ChatResponse> {
        let effective_model = model.unwrap_or_else(|| self.config.preferred_local_model.clone());
        
        match self.config.provider {
            AIProvider::Ollama | AIProvider::Auto => {
                match self.ollama.chat_stream(effective_model, messages.clone(), stream_tx.clone()).await {
                    Ok(response) => Ok(response),
                    Err(e) => {
                        if matches!(self.config.provider, AIProvider::Auto) {
                            if let Some(ref api_key) = self.config.cloud_api_key {
                                self.fallback_to_cloud(messages, api_key.clone(), stream_tx).await
                            } else {
                                Err(e)
                            }
                        } else {
                            Err(e)
                        }
                    }
                }
            }
            AIProvider::OpenAI | AIProvider::Anthropic | AIProvider::Custom => {
                if let Some(ref api_key) = self.config.cloud_api_key {
                    self.fallback_to_cloud(messages, api_key.clone(), stream_tx).await
                } else {
                    Err(BeatPartnerError::Config(
                        "Cloud provider selected but no API key configured".to_string(),
                    ))
                }
            }
        }
    }

    async fn fallback_to_cloud(
        &self,
        _messages: Vec<ChatMessage>,
        _api_key: String,
        _stream_tx: mpsc::Sender<String>,
    ) -> Result<ChatResponse> {
        Err(BeatPartnerError::AIService(
            "Cloud fallback not yet implemented".to_string(),
        ))
    }

    pub async fn list_available_models(&self) -> Result<Vec<OllamaModel>> {
        self.ollama.list_models().await
    }

    pub async fn check_ollama_status(&self) -> Result<crate::models::OllamaStatus> {
        self.ollama.check_status().await
    }

    pub async fn download_model(
        &self,
        model_id: String,
        progress_tx: mpsc::Sender<crate::models::DownloadProgress>,
    ) -> Result<()> {
        self.ollama.download_model(model_id, progress_tx).await
    }

    pub async fn delete_model(&self, model_id: String) -> Result<()> {
        self.ollama.delete_model(model_id).await
    }

    pub fn get_config(&self) -> &AIConfig {
        &self.config
    }

    pub fn update_config(&mut self, config: AIConfig) {
        self.config = config.clone();
        self.ollama = OllamaService::new(config.ollama_base_url);
    }
}

pub struct ProviderStatus {
    pub provider: AIProvider,
    pub available: bool,
    pub latency_ms: Option<u64>,
    pub error: Option<String>,
}
