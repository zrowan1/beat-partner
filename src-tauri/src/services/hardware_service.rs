use crate::error::Result;
use crate::models::{HardwareCapabilities, ModelRecommendation, ModelUseCase};
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};

pub struct HardwareService;

impl HardwareService {
    pub fn detect_capabilities() -> Result<HardwareCapabilities> {
        let mut system = System::new_with_specifics(
            RefreshKind::nothing()
                .with_memory(MemoryRefreshKind::nothing().with_ram())
                .with_cpu(CpuRefreshKind::nothing().with_frequency()),
        );

        system.refresh_all();

        let total_memory_gb = system.total_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
        let cpu_cores = system.cpus().len();
        
        let cpu_vendor = system
            .cpus()
            .first()
            .map(|cpu| cpu.vendor_id().to_string())
            .unwrap_or_else(|| "Unknown".to_string());

        let is_apple_silicon = cfg!(target_os = "macos") && cpu_vendor.contains("Apple");

        let os = if cfg!(target_os = "macos") {
            "macos"
        } else if cfg!(target_os = "windows") {
            "windows"
        } else {
            "linux"
        }
        .to_string();

        let gpu_memory_gb = Self::detect_gpu_memory();

        Ok(HardwareCapabilities {
            total_memory_gb,
            gpu_memory_gb,
            cpu_cores,
            cpu_vendor,
            os,
            is_apple_silicon,
        })
    }

    fn detect_gpu_memory() -> Option<f64> {
        if cfg!(target_os = "macos") {
            Self::detect_gpu_memory_macos()
        } else {
            // Try nvidia-smi first (works on both Windows and Linux with NVIDIA GPUs)
            Self::detect_gpu_memory_nvidia()
        }
    }

    fn detect_gpu_memory_macos() -> Option<f64> {
        let output = std::process::Command::new("system_profiler")
            .args(["SPDisplaysDataType", "-json"])
            .output()
            .ok()?;

        let json_str = String::from_utf8(output.stdout).ok()?;
        let json: serde_json::Value = serde_json::from_str(&json_str).ok()?;

        let displays = json.get("SPDisplaysDataType")?.as_array()?;
        for display in displays {
            if let Some(vram_str) = display.get("spdisplays_vram").and_then(|v| v.as_str()) {
                if let Some(size_str) = vram_str.split_whitespace().next() {
                    if let Ok(size) = size_str.parse::<f64>() {
                        return Some(size);
                    }
                }
            }
        }
        None
    }

    fn detect_gpu_memory_nvidia() -> Option<f64> {
        // nvidia-smi works on both Windows and Linux
        let output = std::process::Command::new("nvidia-smi")
            .args(["--query-gpu=memory.total", "--format=csv,noheader,nounits"])
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }

        let stdout = String::from_utf8(output.stdout).ok()?;
        // nvidia-smi returns memory in MiB, take the first GPU
        let mib: f64 = stdout.lines().next()?.trim().parse().ok()?;
        Some(mib / 1024.0)
    }

    pub fn get_recommendations(
        capabilities: &HardwareCapabilities,
        use_case: Option<ModelUseCase>,
    ) -> Vec<ModelRecommendation> {
        let tier = capabilities.recommended_model_tier();
        let models = tier.recommended_models();

        models
            .into_iter()
            .filter_map(|(id, name, size_gb, use_cases)| {
                if let Some(ref target_use_case) = use_case {
                    if !use_cases.contains(target_use_case) {
                        return None;
                    }
                }

                let reasoning = format!(
                    "This {} model fits well with your {:.0}GB RAM. {}",
                    tier.as_str(),
                    capabilities.total_memory_gb,
                    Self::get_use_case_description(&use_cases)
                );

                let (estimated_speed, quality) = Self::get_model_tier_ratings(size_gb);

                Some(ModelRecommendation {
                    model_id: id.to_string(),
                    name: name.to_string(),
                    size_gb,
                    use_cases: use_cases.clone(),
                    reasoning,
                    estimated_speed: estimated_speed.to_string(),
                    quality: quality.to_string(),
                })
            })
            .collect()
    }

    fn get_use_case_description(use_cases: &[ModelUseCase]) -> String {
        let descriptions: Vec<&str> = use_cases
            .iter()
            .map(|uc| match uc {
                ModelUseCase::General => "Good for general questions",
                ModelUseCase::Theory => "Great for music theory",
                ModelUseCase::Production => "Excellent for production tips",
                ModelUseCase::SoundDesign => "Ideal for sound design",
                ModelUseCase::Mixing => "Perfect for mixing advice",
                ModelUseCase::Mastering => "Best for mastering techniques",
                ModelUseCase::Analysis => "Superior for detailed analysis",
                ModelUseCase::Creative => "Great for creative ideas",
            })
            .collect();

        descriptions.join(", ")
    }

    fn get_model_tier_ratings(size_gb: f64) -> (&'static str, &'static str) {
        match size_gb {
            s if s < 4.0 => ("fast", "basic"),
            s if s < 8.0 => ("medium", "good"),
            s if s < 16.0 => ("medium", "excellent"),
            _ => ("slow", "excellent"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::ModelSizeTier;

    #[test]
    fn test_model_size_tier() {
        let tiny = HardwareCapabilities {
            total_memory_gb: 8.0,
            gpu_memory_gb: None,
            cpu_cores: 8,
            cpu_vendor: "Apple".to_string(),
            os: "macos".to_string(),
            is_apple_silicon: true,
        };
        assert!(matches!(tiny.recommended_model_tier(), ModelSizeTier::Tiny));

        let small = HardwareCapabilities {
            total_memory_gb: 16.0,
            gpu_memory_gb: None,
            cpu_cores: 8,
            cpu_vendor: "Apple".to_string(),
            os: "macos".to_string(),
            is_apple_silicon: true,
        };
        assert!(matches!(small.recommended_model_tier(), ModelSizeTier::Small));

        let medium = HardwareCapabilities {
            total_memory_gb: 32.0,
            gpu_memory_gb: None,
            cpu_cores: 12,
            cpu_vendor: "Apple".to_string(),
            os: "macos".to_string(),
            is_apple_silicon: true,
        };
        assert!(matches!(medium.recommended_model_tier(), ModelSizeTier::Medium));

        let large = HardwareCapabilities {
            total_memory_gb: 64.0,
            gpu_memory_gb: None,
            cpu_cores: 16,
            cpu_vendor: "Apple".to_string(),
            os: "macos".to_string(),
            is_apple_silicon: true,
        };
        assert!(matches!(large.recommended_model_tier(), ModelSizeTier::Large));
    }

    #[test]
    fn test_apple_silicon_bonus() {
        // 18GB Intel → Small (18 is in 13..=20)
        let intel = HardwareCapabilities {
            total_memory_gb: 18.0,
            gpu_memory_gb: None,
            cpu_cores: 8,
            cpu_vendor: "Intel".to_string(),
            os: "macos".to_string(),
            is_apple_silicon: false,
        };

        // 18GB Apple Silicon → 18 * 1.2 = 21.6 → Medium (21..=40)
        let apple = HardwareCapabilities {
            total_memory_gb: 18.0,
            gpu_memory_gb: None,
            cpu_cores: 8,
            cpu_vendor: "Apple".to_string(),
            os: "macos".to_string(),
            is_apple_silicon: true,
        };

        assert!(matches!(intel.recommended_model_tier(), ModelSizeTier::Small));
        assert!(matches!(apple.recommended_model_tier(), ModelSizeTier::Medium));
    }
}
