use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioAnalysisResult {
    pub file_path: String,
    pub bpm: Option<f64>,
    pub key: Option<String>,
    pub duration_secs: f64,
    pub sample_rate: u32,
    pub channels: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpectrumData {
    pub magnitudes: Vec<f32>,
    pub frequency_resolution: f32,
    pub sample_rate: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum AnalysisProgress {
    #[serde(rename_all = "camelCase")]
    Decoding { percent: f32 },
    #[serde(rename_all = "camelCase")]
    Analyzing { step: String, percent: f32 },
    #[serde(rename_all = "camelCase")]
    Complete { result: AudioAnalysisResult },
    #[serde(rename_all = "camelCase")]
    Error { message: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReferenceTrack {
    pub id: Option<i64>,
    pub project_id: i64,
    pub file_path: String,
    pub file_name: String,
    pub bpm: Option<f64>,
    pub key: Option<String>,
    pub duration_secs: f64,
    pub added_at: Option<String>,
}
