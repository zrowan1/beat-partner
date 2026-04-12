use serde::{Deserialize, Serialize};

/// Public OpenRouter model struct sent to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenRouterModel {
    /// Full model id, e.g. "anthropic/claude-sonnet-4-5"
    pub id: String,
    /// Human-readable name, e.g. "Claude Sonnet 4.5"
    pub name: String,
    pub description: Option<String>,
    /// Maximum context window in tokens
    pub context_length: u32,
    /// Cost per 1M prompt tokens in USD (0 = free)
    pub pricing_prompt: f64,
    /// Cost per 1M completion tokens in USD (0 = free)
    pub pricing_completion: f64,
    /// true when both prompt and completion pricing are $0
    pub is_free: bool,
    /// Provider name derived from the id prefix, e.g. "Anthropic", "Meta"
    pub top_provider: String,
}

// ── Internal deserialization types for the OpenRouter /v1/models response ──

#[derive(Debug, Deserialize)]
pub(crate) struct OpenRouterModelsResponse {
    pub data: Vec<OpenRouterModelRaw>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct OpenRouterModelRaw {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub context_length: Option<u32>,
    pub pricing: Option<OpenRouterPricing>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct OpenRouterPricing {
    pub prompt: Option<String>,
    pub completion: Option<String>,
}

impl OpenRouterModelRaw {
    pub fn into_model(self) -> OpenRouterModel {
        let pricing_prompt = self
            .pricing
            .as_ref()
            .and_then(|p| p.prompt.as_deref())
            .and_then(|s| s.parse::<f64>().ok())
            .unwrap_or(0.0)
            * 1_000_000.0; // convert per-token → per-1M-tokens

        let pricing_completion = self
            .pricing
            .as_ref()
            .and_then(|p| p.completion.as_deref())
            .and_then(|s| s.parse::<f64>().ok())
            .unwrap_or(0.0)
            * 1_000_000.0;

        let is_free = pricing_prompt == 0.0 && pricing_completion == 0.0;

        // "anthropic/claude-..." → "Anthropic"
        let top_provider = self
            .id
            .split('/')
            .next()
            .map(|s| {
                let mut c = s.chars();
                match c.next() {
                    None => String::new(),
                    Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
                }
            })
            .unwrap_or_else(|| "Unknown".to_string());

        OpenRouterModel {
            id: self.id,
            name: self.name.unwrap_or_else(|| "Unnamed model".to_string()),
            description: self.description,
            context_length: self.context_length.unwrap_or(0),
            pricing_prompt,
            pricing_completion,
            is_free,
            top_provider,
        }
    }
}
