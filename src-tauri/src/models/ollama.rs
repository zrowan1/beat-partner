use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaModel {
    pub id: String,
    pub name: String,
    pub description: String,
    pub size_gb: f64,
    pub parameter_count: String,
    pub use_cases: Vec<ModelUseCase>,
    pub quantization: String,
    pub installed: bool,
    pub downloaded_at: Option<String>,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ModelUseCase {
    General,
    Theory,
    Production,
    SoundDesign,
    Mixing,
    Mastering,
    Analysis,
    Creative,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareCapabilities {
    pub total_memory_gb: f64,
    pub gpu_memory_gb: Option<f64>,
    pub cpu_cores: usize,
    pub cpu_vendor: String,
    pub os: String,
    pub is_apple_silicon: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRecommendation {
    pub model_id: String,
    pub name: String,
    pub size_gb: f64,
    pub use_cases: Vec<ModelUseCase>,
    pub reasoning: String,
    pub estimated_speed: String,
    pub quality: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub model_id: String,
    pub status: String,
    pub bytes_downloaded: u64,
    pub bytes_total: u64,
    pub percentage: f64,
    pub speed_mbps: f64,
    pub estimated_seconds_remaining: u64,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaStatus {
    pub available: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub message: ChatMessage,
    pub model: String,
    pub done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaTag {
    pub name: String,
    pub model: String,
    pub modified_at: String,
    pub size: u64,
    pub digest: String,
    pub details: OllamaModelDetails,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaTagResponse {
    pub models: Vec<OllamaTag>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaModelDetails {
    pub parent_model: Option<String>,
    pub format: String,
    pub family: String,
    pub families: Option<Vec<String>>,
    pub parameter_size: String,
    pub quantization_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaPullRequest {
    pub name: String,
    pub stream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaPullProgress {
    pub status: String,
    pub digest: Option<String>,
    pub total: Option<u64>,
    pub completed: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub stream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaChatResponse {
    pub model: String,
    pub created_at: String,
    pub message: ChatMessage,
    pub done: bool,
}

impl HardwareCapabilities {
    pub fn recommended_model_tier(&self) -> ModelSizeTier {
        let effective_memory = if self.is_apple_silicon {
            self.total_memory_gb * 1.2
        } else {
            self.total_memory_gb
        };

        match effective_memory as u32 {
            0..=12 => ModelSizeTier::Tiny,
            13..=20 => ModelSizeTier::Small,
            21..=40 => ModelSizeTier::Medium,
            _ => ModelSizeTier::Large,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ModelSizeTier {
    Tiny,    // < 4GB  - Geschikt voor 8GB RAM
    Small,   // 4-8GB  - Geschikt voor 16GB RAM
    Medium,  // 8-16GB - Geschikt voor 32GB RAM
    Large,   // > 16GB - Geschikt voor 64GB+ RAM
}

impl ModelSizeTier {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelSizeTier::Tiny => "tiny",
            ModelSizeTier::Small => "small",
            ModelSizeTier::Medium => "medium",
            ModelSizeTier::Large => "large",
        }
    }

    pub fn recommended_models(&self) -> Vec<(&'static str, &'static str, f64, Vec<ModelUseCase>)> {
        match self {
            ModelSizeTier::Tiny => vec![
                ("qwen2.5:3b", "Qwen 2.5 3B", 2.0, vec![ModelUseCase::General, ModelUseCase::Creative]),
                ("phi4:3.8b", "Phi-4 3.8B", 2.5, vec![ModelUseCase::General, ModelUseCase::Theory]),
                ("gemma3:4b", "Gemma 3 4B", 3.0, vec![ModelUseCase::General, ModelUseCase::Production]),
            ],
            ModelSizeTier::Small => vec![
                ("llama3.2", "Llama 3.2", 4.0, vec![ModelUseCase::General, ModelUseCase::Theory, ModelUseCase::Production]),
                ("mistral:7b", "Mistral 7B", 7.0, vec![ModelUseCase::General, ModelUseCase::Theory, ModelUseCase::Analysis]),
                ("qwen2.5:7b", "Qwen 2.5 7B", 6.5, vec![ModelUseCase::General, ModelUseCase::Production, ModelUseCase::Creative]),
            ],
            ModelSizeTier::Medium => vec![
                ("llama3.1:8b", "Llama 3.1 8B", 8.0, vec![ModelUseCase::General, ModelUseCase::Theory, ModelUseCase::Production, ModelUseCase::Analysis]),
                ("deepseek-r1:14b", "DeepSeek R1 14B", 14.0, vec![ModelUseCase::Analysis, ModelUseCase::Theory, ModelUseCase::Production]),
                ("qwen2.5:14b", "Qwen 2.5 14B", 13.0, vec![ModelUseCase::General, ModelUseCase::Theory, ModelUseCase::Analysis, ModelUseCase::Mixing]),
            ],
            ModelSizeTier::Large => vec![
                ("llama3.3:70b", "Llama 3.3 70B", 70.0, vec![ModelUseCase::Analysis, ModelUseCase::Mastering, ModelUseCase::SoundDesign]),
                ("mixtral:8x7b", "Mixtral 8x7B", 48.0, vec![ModelUseCase::General, ModelUseCase::Theory, ModelUseCase::Production, ModelUseCase::Analysis]),
                ("qwq:32b", "QwQ 32B", 32.0, vec![ModelUseCase::Analysis, ModelUseCase::Theory, ModelUseCase::Creative]),
            ],
        }
    }
}
