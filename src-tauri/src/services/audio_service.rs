use std::fs::File;
use std::io::Read;
use std::path::Path;

use realfft::RealFftPlanner;
use sha2::{Digest, Sha256};
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

use crate::db::Database;
use crate::error::Result;
use crate::models::{AudioAnalysisResult, SpectrumData};

pub struct AudioService;

impl AudioService {
    /// Decode audio file to mono f32 samples using symphonia.
    /// Returns (samples, sample_rate).
    pub fn decode_audio(file_path: &str) -> Result<(Vec<f32>, u32, u16)> {
        let path = Path::new(file_path);
        let file = File::open(path).map_err(|e| {
            crate::error::BeatPartnerError::AudioAnalysis(format!(
                "Cannot open file: {}",
                e
            ))
        })?;

        let mss = MediaSourceStream::new(Box::new(file), Default::default());

        let mut hint = Hint::new();
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            hint.with_extension(ext);
        }

        let probed = symphonia::default::get_probe()
            .format(
                &hint,
                mss,
                &FormatOptions::default(),
                &MetadataOptions::default(),
            )
            .map_err(|e| {
                crate::error::BeatPartnerError::AudioAnalysis(format!(
                    "Unsupported format: {}",
                    e
                ))
            })?;

        let mut format = probed.format;

        let track = format
            .default_track()
            .ok_or_else(|| {
                crate::error::BeatPartnerError::AudioAnalysis(
                    "No audio track found".to_string(),
                )
            })?;

        let sample_rate = track
            .codec_params
            .sample_rate
            .unwrap_or(44100);
        let channels = track
            .codec_params
            .channels
            .map(|c| c.count() as u16)
            .unwrap_or(2);
        let track_id = track.id;

        let mut decoder = symphonia::default::get_codecs()
            .make(&track.codec_params, &DecoderOptions::default())
            .map_err(|e| {
                crate::error::BeatPartnerError::AudioAnalysis(format!(
                    "Codec error: {}",
                    e
                ))
            })?;

        let mut all_samples: Vec<f32> = Vec::new();
        // Limit to ~60 seconds for analysis efficiency
        let max_samples = sample_rate as usize * 60;

        loop {
            let packet = match format.next_packet() {
                Ok(p) => p,
                Err(symphonia::core::errors::Error::IoError(ref e))
                    if e.kind() == std::io::ErrorKind::UnexpectedEof =>
                {
                    break;
                }
                Err(_) => break,
            };

            if packet.track_id() != track_id {
                continue;
            }

            let decoded = match decoder.decode(&packet) {
                Ok(d) => d,
                Err(_) => continue,
            };

            let spec = *decoded.spec();
            let num_channels = spec.channels.count();
            let num_frames = decoded.capacity();

            if num_frames == 0 {
                continue;
            }

            let mut sample_buf = SampleBuffer::<f32>::new(
                num_frames as u64,
                *decoded.spec(),
            );
            sample_buf.copy_interleaved_ref(decoded);
            let samples = sample_buf.samples();

            // Mix to mono
            if num_channels == 1 {
                all_samples.extend_from_slice(samples);
            } else {
                for chunk in samples.chunks(num_channels) {
                    let mono: f32 =
                        chunk.iter().sum::<f32>() / num_channels as f32;
                    all_samples.push(mono);
                }
            }

            if all_samples.len() >= max_samples {
                all_samples.truncate(max_samples);
                break;
            }
        }

        if all_samples.is_empty() {
            return Err(crate::error::BeatPartnerError::AudioAnalysis(
                "No audio data decoded".to_string(),
            ));
        }

        Ok((all_samples, sample_rate, channels))
    }

    /// BPM detection using onset energy + autocorrelation.
    pub fn detect_bpm(samples: &[f32], sample_rate: u32) -> Result<f64> {
        let hop_size = 512;
        let frame_size = 1024;

        if samples.len() < frame_size * 2 {
            return Err(crate::error::BeatPartnerError::AudioAnalysis(
                "Audio too short for BPM detection".to_string(),
            ));
        }

        // Compute spectral flux onset detection function
        let mut planner = RealFftPlanner::<f32>::new();
        let fft = planner.plan_fft_forward(frame_size);

        let num_frames = (samples.len() - frame_size) / hop_size;
        let mut onset_signal = Vec::with_capacity(num_frames);
        let mut prev_magnitudes: Option<Vec<f32>> = None;
        let spectrum_len = frame_size / 2 + 1;

        for i in 0..num_frames {
            let start = i * hop_size;
            let end = start + frame_size;
            if end > samples.len() {
                break;
            }

            // Apply Hann window and compute FFT
            let mut frame: Vec<f32> = samples[start..end]
                .iter()
                .enumerate()
                .map(|(n, &s)| {
                    let w = 0.5
                        * (1.0
                            - (2.0 * std::f32::consts::PI * n as f32
                                / (frame_size - 1) as f32)
                                .cos());
                    s * w
                })
                .collect();

            let mut spectrum = fft.make_output_vec();
            fft.process(&mut frame, &mut spectrum).map_err(|e| {
                crate::error::BeatPartnerError::AudioAnalysis(format!(
                    "FFT error: {}",
                    e
                ))
            })?;

            let magnitudes: Vec<f32> = spectrum
                .iter()
                .take(spectrum_len)
                .map(|c| (c.re * c.re + c.im * c.im).sqrt())
                .collect();

            // Spectral flux: sum of positive differences
            if let Some(ref prev) = prev_magnitudes {
                let flux: f32 = magnitudes
                    .iter()
                    .zip(prev.iter())
                    .map(|(curr, prev)| (curr - prev).max(0.0))
                    .sum();
                onset_signal.push(flux);
            }

            prev_magnitudes = Some(magnitudes);
        }

        if onset_signal.len() < 100 {
            return Err(crate::error::BeatPartnerError::AudioAnalysis(
                "Audio too short for BPM detection".to_string(),
            ));
        }

        // Normalize onset signal
        let max_onset = onset_signal
            .iter()
            .cloned()
            .fold(f32::NEG_INFINITY, f32::max);
        if max_onset > 0.0 {
            for v in &mut onset_signal {
                *v /= max_onset;
            }
        }

        // Autocorrelation to find dominant periodicity
        // BPM range: 60-200 → period in onset frames
        let onset_rate = sample_rate as f64 / hop_size as f64;
        let min_lag = (onset_rate * 60.0 / 200.0) as usize; // 200 BPM
        let max_lag = (onset_rate * 60.0 / 60.0) as usize; // 60 BPM
        let max_lag = max_lag.min(onset_signal.len() / 2);

        if min_lag >= max_lag {
            return Err(crate::error::BeatPartnerError::AudioAnalysis(
                "Audio too short for BPM detection".to_string(),
            ));
        }

        let mut best_lag = min_lag;
        let mut best_corr = f64::NEG_INFINITY;

        for lag in min_lag..=max_lag {
            let mut corr = 0.0f64;
            let len = onset_signal.len() - lag;
            for i in 0..len {
                corr += onset_signal[i] as f64 * onset_signal[i + lag] as f64;
            }
            corr /= len as f64;

            if corr > best_corr {
                best_corr = corr;
                best_lag = lag;
            }
        }

        let bpm = onset_rate * 60.0 / best_lag as f64;

        // Clamp to reasonable range (double/half if out of range)
        let bpm = if bpm < 60.0 {
            bpm * 2.0
        } else if bpm > 200.0 {
            bpm / 2.0
        } else {
            bpm
        };

        // Round to 1 decimal
        Ok((bpm * 10.0).round() / 10.0)
    }

    /// Key detection using chromagram + Krumhansl-Kessler profiles.
    pub fn detect_key(samples: &[f32], sample_rate: u32) -> Result<String> {
        let frame_size = 4096;
        let hop_size = 2048;

        if samples.len() < frame_size {
            return Err(crate::error::BeatPartnerError::AudioAnalysis(
                "Audio too short for key detection".to_string(),
            ));
        }

        let mut planner = RealFftPlanner::<f32>::new();
        let fft = planner.plan_fft_forward(frame_size);
        let spectrum_len = frame_size / 2 + 1;

        let num_frames = (samples.len() - frame_size) / hop_size + 1;
        let mut chroma = [0.0f64; 12];

        for i in 0..num_frames {
            let start = i * hop_size;
            let end = start + frame_size;
            if end > samples.len() {
                break;
            }

            // Apply Hann window
            let mut frame: Vec<f32> = samples[start..end]
                .iter()
                .enumerate()
                .map(|(n, &s)| {
                    let w = 0.5
                        * (1.0
                            - (2.0 * std::f32::consts::PI * n as f32
                                / (frame_size - 1) as f32)
                                .cos());
                    s * w
                })
                .collect();

            let mut spectrum = fft.make_output_vec();
            fft.process(&mut frame, &mut spectrum).map_err(|e| {
                crate::error::BeatPartnerError::AudioAnalysis(format!(
                    "FFT error: {}",
                    e
                ))
            })?;

            // Fold into 12 pitch classes
            for (bin, c) in spectrum.iter().enumerate().take(spectrum_len) {
                let freq =
                    bin as f64 * sample_rate as f64 / frame_size as f64;
                if freq < 27.5 || freq > 4186.0 {
                    continue; // Skip sub-bass and ultra-high
                }

                let magnitude = (c.re * c.re + c.im * c.im).sqrt() as f64;
                // MIDI note number from frequency
                let midi = 69.0 + 12.0 * (freq / 440.0).log2();
                let pitch_class = ((midi.round() as i32) % 12 + 12) % 12;
                chroma[pitch_class as usize] += magnitude * magnitude;
            }
        }

        // Normalize chroma
        let max_chroma = chroma
            .iter()
            .cloned()
            .fold(f64::NEG_INFINITY, f64::max);
        if max_chroma > 0.0 {
            for c in &mut chroma {
                *c /= max_chroma;
            }
        }

        // Krumhansl-Kessler key profiles
        let major_profile: [f64; 12] = [
            6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66,
            2.29, 2.88,
        ];
        let minor_profile: [f64; 12] = [
            6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69,
            3.34, 3.17,
        ];

        let note_names = [
            "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#",
            "B",
        ];

        let mut best_key = String::new();
        let mut best_corr = f64::NEG_INFINITY;

        for root in 0..12 {
            // Rotate chroma to align with root
            let mut rotated = [0.0f64; 12];
            for i in 0..12 {
                rotated[i] = chroma[(i + root) % 12];
            }

            // Correlate with major profile
            let major_corr = pearson_correlation(&rotated, &major_profile);
            if major_corr > best_corr {
                best_corr = major_corr;
                best_key =
                    format!("{} major", note_names[root]);
            }

            // Correlate with minor profile
            let minor_corr = pearson_correlation(&rotated, &minor_profile);
            if minor_corr > best_corr {
                best_corr = minor_corr;
                best_key =
                    format!("{} minor", note_names[root]);
            }
        }

        Ok(best_key)
    }

    /// Compute FFT spectrum for visualization.
    pub fn compute_spectrum(
        samples: &[f32],
        sample_rate: u32,
        fft_size: usize,
    ) -> Result<SpectrumData> {
        if samples.len() < fft_size {
            return Err(crate::error::BeatPartnerError::AudioAnalysis(
                "Audio too short for spectrum analysis".to_string(),
            ));
        }

        let mut planner = RealFftPlanner::<f32>::new();
        let fft = planner.plan_fft_forward(fft_size);
        let spectrum_len = fft_size / 2 + 1;

        // Average spectrum over multiple frames for a stable view
        let hop_size = fft_size / 2;
        let num_frames =
            ((samples.len() - fft_size) / hop_size + 1).max(1);
        let mut avg_magnitudes = vec![0.0f64; spectrum_len];

        for i in 0..num_frames {
            let start = i * hop_size;
            let end = start + fft_size;
            if end > samples.len() {
                break;
            }

            // Apply Hann window
            let mut frame: Vec<f32> = samples[start..end]
                .iter()
                .enumerate()
                .map(|(n, &s)| {
                    let w = 0.5
                        * (1.0
                            - (2.0 * std::f32::consts::PI * n as f32
                                / (fft_size - 1) as f32)
                                .cos());
                    s * w
                })
                .collect();

            let mut spectrum = fft.make_output_vec();
            fft.process(&mut frame, &mut spectrum).map_err(|e| {
                crate::error::BeatPartnerError::AudioAnalysis(format!(
                    "FFT error: {}",
                    e
                ))
            })?;

            for (j, c) in
                spectrum.iter().enumerate().take(spectrum_len)
            {
                let mag = (c.re * c.re + c.im * c.im).sqrt() as f64;
                avg_magnitudes[j] += mag;
            }
        }

        // Average and convert to dB scale
        let magnitudes: Vec<f32> = avg_magnitudes
            .iter()
            .map(|&m| {
                let avg = m / num_frames as f64;
                // Convert to dB (with floor at -100dB)
                let db = if avg > 0.0 {
                    20.0 * avg.log10()
                } else {
                    -100.0
                };
                db.max(-100.0) as f32
            })
            .collect();

        let frequency_resolution =
            sample_rate as f32 / fft_size as f32;

        Ok(SpectrumData {
            magnitudes,
            frequency_resolution,
            sample_rate,
        })
    }

    /// Full analysis: decode + detect BPM + detect key.
    pub fn analyze_file(file_path: &str) -> Result<AudioAnalysisResult> {
        let (samples, sample_rate, channels) =
            Self::decode_audio(file_path)?;

        let duration_secs = samples.len() as f64 / sample_rate as f64;
        let bpm = Self::detect_bpm(&samples, sample_rate).ok();
        let key = Self::detect_key(&samples, sample_rate).ok();

        Ok(AudioAnalysisResult {
            file_path: file_path.to_string(),
            bpm,
            key,
            duration_secs,
            sample_rate,
            channels,
        })
    }

    /// Compute SHA-256 hash of a file for cache invalidation.
    pub fn file_hash(file_path: &str) -> Result<String> {
        let mut file = File::open(file_path)?;
        let mut hasher = Sha256::new();
        let mut buffer = [0u8; 8192];

        loop {
            let bytes_read = file.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }

        Ok(format!("{:x}", hasher.finalize()))
    }

    /// Look up cached analysis result.
    pub fn get_cached(
        db: &Database,
        file_path: &str,
        file_hash: &str,
        analysis_type: &str,
    ) -> Result<Option<String>> {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT results_json FROM audio_analysis \
             WHERE file_path = ?1 AND file_hash = ?2 AND analysis_type = ?3",
        )?;

        let result = stmt
            .query_row(
                rusqlite::params![file_path, file_hash, analysis_type],
                |row| row.get::<_, String>(0),
            )
            .ok();

        Ok(result)
    }

    /// Store analysis result in cache.
    pub fn store_cache(
        db: &Database,
        file_path: &str,
        file_hash: &str,
        analysis_type: &str,
        results_json: &str,
    ) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO audio_analysis \
             (file_path, file_hash, analysis_type, results_json) \
             VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![file_path, file_hash, analysis_type, results_json],
        )?;
        Ok(())
    }

    /// Analyze with caching support.
    pub fn analyze_file_cached(
        db: &Database,
        file_path: &str,
    ) -> Result<AudioAnalysisResult> {
        let hash = Self::file_hash(file_path)?;

        // Check cache
        if let Some(cached) = Self::get_cached(db, file_path, &hash, "full")? {
            if let Ok(result) =
                serde_json::from_str::<AudioAnalysisResult>(&cached)
            {
                return Ok(result);
            }
        }

        // Analyze
        let result = Self::analyze_file(file_path)?;

        // Cache result
        if let Ok(json) = serde_json::to_string(&result) {
            let _ = Self::store_cache(db, file_path, &hash, "full", &json);
        }

        Ok(result)
    }
}

/// Pearson correlation coefficient between two arrays.
fn pearson_correlation(a: &[f64; 12], b: &[f64; 12]) -> f64 {
    let n = 12.0;
    let sum_a: f64 = a.iter().sum();
    let sum_b: f64 = b.iter().sum();
    let sum_ab: f64 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let sum_a2: f64 = a.iter().map(|x| x * x).sum();
    let sum_b2: f64 = b.iter().map(|x| x * x).sum();

    let numerator = n * sum_ab - sum_a * sum_b;
    let denominator =
        ((n * sum_a2 - sum_a * sum_a) * (n * sum_b2 - sum_b * sum_b)).sqrt();

    if denominator == 0.0 {
        0.0
    } else {
        numerator / denominator
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pearson_correlation_identical() {
        let a = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0];
        let corr = pearson_correlation(&a, &a);
        assert!((corr - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_detect_bpm_click_track() {
        // Generate a synthetic click track at 120 BPM
        let sample_rate = 44100u32;
        let bpm = 120.0;
        let duration_secs = 10.0;
        let total_samples = (sample_rate as f64 * duration_secs) as usize;
        let samples_per_beat = (sample_rate as f64 * 60.0 / bpm) as usize;

        let mut samples = vec![0.0f32; total_samples];
        let click_len = 200;

        for beat in 0..(duration_secs * bpm / 60.0) as usize {
            let start = beat * samples_per_beat;
            for j in 0..click_len.min(total_samples - start) {
                // Short burst of noise as a click
                samples[start + j] = if j % 2 == 0 { 0.8 } else { -0.8 };
            }
        }

        let detected = AudioService::detect_bpm(&samples, sample_rate).unwrap();
        // Allow +/- 5 BPM tolerance
        assert!(
            (detected - bpm).abs() < 5.0,
            "Expected ~{} BPM, got {} BPM",
            bpm,
            detected
        );
    }

    #[test]
    fn test_compute_spectrum_dimensions() {
        let sample_rate = 44100u32;
        let fft_size = 4096;
        let samples = vec![0.0f32; sample_rate as usize]; // 1 second of silence

        let spectrum =
            AudioService::compute_spectrum(&samples, sample_rate, fft_size)
                .unwrap();

        assert_eq!(spectrum.magnitudes.len(), fft_size / 2 + 1);
        assert!((spectrum.frequency_resolution - sample_rate as f32 / fft_size as f32).abs() < 0.01);
        assert_eq!(spectrum.sample_rate, sample_rate);
    }
}
