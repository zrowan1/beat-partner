use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VocalProductionNotes {
    pub id: Option<i64>,
    pub project_id: i64,
    pub mic_choice: Option<String>,
    pub vocal_chain: VocalChain,
    pub recording_notes: Option<String>,
    pub editing_notes: Option<String>,
    pub tuning_notes: Option<String>,
    pub checklist: Vec<ChecklistItem>,
    pub comping_progress: CompingProgress,
    pub tuning_timing_progress: TuningTimingProgress,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VocalChain {
    pub eq: String,
    pub compressor: String,
    pub reverb: String,
    pub delay: String,
    pub other: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChecklistItem {
    pub id: String,
    pub category: ChecklistCategory,
    pub text: String,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ChecklistCategory {
    MicSetup,
    GainStaging,
    Room,
    Takes,
    Performance,
    Custom,
}

impl ChecklistCategory {
    pub fn as_str(&self) -> &'static str {
        match self {
            ChecklistCategory::MicSetup => "mic-setup",
            ChecklistCategory::GainStaging => "gain-staging",
            ChecklistCategory::Room => "room",
            ChecklistCategory::Takes => "takes",
            ChecklistCategory::Performance => "performance",
            ChecklistCategory::Custom => "custom",
        }
    }

    pub fn label(&self) -> &'static str {
        match self {
            ChecklistCategory::MicSetup => "Mic Setup",
            ChecklistCategory::GainStaging => "Gain Staging",
            ChecklistCategory::Room => "Room",
            ChecklistCategory::Takes => "Takes",
            ChecklistCategory::Performance => "Performance",
            ChecklistCategory::Custom => "Custom",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CompingProgress {
    pub completed_sections: Vec<String>,
    pub user_notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TuningTimingProgress {
    pub completed_sections: Vec<String>,
    pub user_notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReferenceVocal {
    pub id: Option<i64>,
    pub project_id: i64,
    pub file_path: String,
    pub file_name: String,
    pub artist_name: Option<String>,
    pub bpm: Option<f64>,
    pub key: Option<String>,
    pub duration_secs: f64,
    pub notes: Option<String>,
    pub added_at: Option<String>,
}

/// Returns the default checklist items for a new project.
pub fn default_checklist() -> Vec<ChecklistItem> {
    vec![
        ChecklistItem {
            id: "mic-1".to_string(),
            category: ChecklistCategory::MicSetup,
            text: "Pop filter placed 2-4 inches from mic".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "mic-2".to_string(),
            category: ChecklistCategory::MicSetup,
            text: "Mic positioned at correct height (mouth level)".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "mic-3".to_string(),
            category: ChecklistCategory::MicSetup,
            text: "Shock mount securely fastened".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "mic-4".to_string(),
            category: ChecklistCategory::MicSetup,
            text: "Cable checked for interference/noise".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "gain-1".to_string(),
            category: ChecklistCategory::GainStaging,
            text: "Input level checked with loudest passage".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "gain-2".to_string(),
            category: ChecklistCategory::GainStaging,
            text: "Headroom at ~-12dB (peaks around -6dB)".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "gain-3".to_string(),
            category: ChecklistCategory::GainStaging,
            text: "No clipping or digital distortion".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "room-1".to_string(),
            category: ChecklistCategory::Room,
            text: "Room silence checked (no hum, buzz, AC)".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "room-2".to_string(),
            category: ChecklistCategory::Room,
            text: "Reflections minimized (blankets/panels if needed)".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "room-3".to_string(),
            category: ChecklistCategory::Room,
            text: "Phone on silent / notifications off".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "takes-1".to_string(),
            category: ChecklistCategory::Takes,
            text: "Recorded multiple takes (at least 3)".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "takes-2".to_string(),
            category: ChecklistCategory::Takes,
            text: "Comp markers placed for best sections".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "takes-3".to_string(),
            category: ChecklistCategory::Takes,
            text: "Consistent naming convention used".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "perf-1".to_string(),
            category: ChecklistCategory::Performance,
            text: "Vocal warm-up completed".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "perf-2".to_string(),
            category: ChecklistCategory::Performance,
            text: "Water/tea available for vocalist".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "perf-3".to_string(),
            category: ChecklistCategory::Performance,
            text: "Lyrics/teleprompter ready and visible".to_string(),
            completed: false,
        },
        ChecklistItem {
            id: "perf-4".to_string(),
            category: ChecklistCategory::Performance,
            text: "Headphone mix balanced and comfortable".to_string(),
            completed: false,
        },
    ]
}
