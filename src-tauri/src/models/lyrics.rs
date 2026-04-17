use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Lyrics {
    pub id: Option<i64>,
    pub project_id: i64,
    pub content: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricAnnotation {
    pub id: Option<i64>,
    pub lyrics_id: i64,
    pub start_index: i64,
    pub end_index: i64,
    pub tag: LyricTag,
    pub color: Option<String>,
    pub note: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum LyricTag {
    Melody,
    #[serde(rename = "ad-lib")]
    AdLib,
    Harmony,
    Flow,
    Emphasis,
    Note,
}

impl LyricTag {
    pub fn as_str(&self) -> &'static str {
        match self {
            LyricTag::Melody => "melody",
            LyricTag::AdLib => "ad-lib",
            LyricTag::Harmony => "harmony",
            LyricTag::Flow => "flow",
            LyricTag::Emphasis => "emphasis",
            LyricTag::Note => "note",
        }
    }
}
