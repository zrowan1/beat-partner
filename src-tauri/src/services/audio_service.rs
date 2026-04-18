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
    /// Returns (samples, sample_rate, channels, duration_secs).
    /// Duration is the actual file duration; samples may be truncated for analysis.
    pub fn decode_audio(file_path: &str) -> Result<(Vec<f32>, u32, u16, f64)> {
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

        // Compute actual duration from container metadata if available
        let duration_secs = track
            .codec_params
            .n_frames
            .map(|n| n as f64 / sample_rate as f64)
            .unwrap_or_else(|| {
                // Fallback: we'll compute from decoded samples later
                0.0
            });

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

        let final_duration = if duration_secs > 0.0 {
            duration_secs
        } else {
            all_samples.len() as f64 / sample_rate as f64
        };

        Ok((all_samples, sample_rate, channels, final_duration))
    }

    /// BPM detection using combined onset detection + autocorrelation with harmonic voting.
    pub fn detect_bpm(samples: &[f32], sample_rate: u32) -> Result<f64> {
        let hop_size = 512;
        let frame_size = 1024;

        if samples.len() < frame_size * 2 {
            return Err(crate::error::BeatPartnerError::AudioAnalysis(
                "Audio too short for BPM detection".to_string(),
            ));
        }

        let num_frames = (samples.len() - frame_size) / hop_size;
        let mut onset_signal = Vec::with_capacity(num_frames);
        let mut prev_magnitudes: Option<Vec<f32>> = None;
        let mut prev_energy: f32 = 0.0;
        let spectrum_len = frame_size / 2 + 1;

        let mut planner = RealFftPlanner::<f32>::new();
        let fft = planner.plan_fft_forward(frame_size);

        for i in 0..num_frames {
            let start = i * hop_size;
            let end = start + frame_size;
            if end > samples.len() {
                break;
            }

            let frame = &samples[start..end];

            // Energy-based onset detection (good for drums in rock)
            let energy: f32 = frame.iter().map(|s| s * s).sum();
            let energy_diff = (energy - prev_energy).max(0.0);
            prev_energy = energy;

            // Apply Hann window and compute FFT
            let mut windowed: Vec<f32> = frame
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
            fft.process(&mut windowed, &mut spectrum).map_err(|e| {
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
            let mut flux = 0.0f32;
            if let Some(ref prev) = prev_magnitudes {
                flux = magnitudes
                    .iter()
                    .zip(prev.iter())
                    .map(|(curr, prev)| (curr - prev).max(0.0))
                    .sum();
            }

            // Combine spectral flux and energy difference
            let combined = flux + energy_diff * 0.5;
            onset_signal.push(combined);

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
        let onset_rate = sample_rate as f64 / hop_size as f64;
        let min_lag = (onset_rate * 60.0 / 200.0) as usize; // 200 BPM
        let max_lag = (onset_rate * 60.0 / 60.0) as usize; // 60 BPM
        let max_lag = max_lag.min(onset_signal.len() / 2);

        if min_lag >= max_lag {
            return Err(crate::error::BeatPartnerError::AudioAnalysis(
                "Audio too short for BPM detection".to_string(),
            ));
        }

        let mut autocorr = vec![0.0f64; max_lag + 2];

        for lag in min_lag..=max_lag {
            let mut corr = 0.0f64;
            let len = onset_signal.len() - lag;
            for i in 0..len {
                corr += onset_signal[i] as f64 * onset_signal[i + lag] as f64;
            }
            corr /= len as f64;
            autocorr[lag] = corr;
        }

        // Find local peaks in autocorrelation
        let mut peaks: Vec<(usize, f64)> = Vec::new();
        for lag in (min_lag + 1)..max_lag {
            if autocorr[lag] > autocorr[lag - 1] && autocorr[lag] > autocorr[lag + 1] {
                peaks.push((lag, autocorr[lag]));
            }
        }

        if peaks.is_empty() {
            // Fallback to global maximum
            let mut best_lag = min_lag;
            let mut best_corr = f64::NEG_INFINITY;
            for lag in min_lag..=max_lag {
                if autocorr[lag] > best_corr {
                    best_corr = autocorr[lag];
                    best_lag = lag;
                }
            }
            peaks.push((best_lag, best_corr));
        }

        // Score peaks with harmonic support voting
        fn score_peak(peaks: &[(usize, f64)], idx: usize, onset_rate: f64) -> f64 {
            let (lag, corr) = peaks[idx];
            let bpm = onset_rate * 60.0 / lag as f64;
            let mut score = corr;

            for (other_idx, (other_lag, other_corr)) in peaks.iter().enumerate() {
                if idx == other_idx {
                    continue;
                }
                let other_bpm = onset_rate * 60.0 / *other_lag as f64;
                let ratio = bpm / other_bpm;
                // Reward harmonic relationships: 2x, 3x, 0.5x, 0.33x
                let harmonics = [2.0, 3.0, 4.0, 0.5, 0.333_333_333_333_333_3];
                for h in &harmonics {
                    if (ratio - h).abs() < 0.08 {
                        score += other_corr * 0.35;
                    }
                }
            }

            // Slight preference for musically common tempi (80-160)
            if (80.0..=160.0).contains(&bpm) {
                score *= 1.05;
            }

            score
        }

        let mut best_peak_idx = 0usize;
        let mut best_score = f64::NEG_INFINITY;

        for i in 0..peaks.len() {
            let score = score_peak(&peaks, i, onset_rate);
            if score > best_score {
                best_score = score;
                best_peak_idx = i;
            }
        }

        let best_lag = peaks[best_peak_idx].0;

        // Parabolic interpolation around the peak for sub-lag accuracy
        let alpha = autocorr[best_lag.saturating_sub(1)];
        let beta = autocorr[best_lag];
        let gamma = autocorr[(best_lag + 1).min(max_lag)];
        let interpolated_lag = if (alpha - 2.0 * beta + gamma).abs() > 1e-10 {
            let p = (alpha - gamma) / (2.0 * (alpha - 2.0 * beta + gamma));
            (best_lag as f64 - p).max(min_lag as f64).min(max_lag as f64)
        } else {
            best_lag as f64
        };

        let bpm = onset_rate * 60.0 / interpolated_lag;

        // Fix octave errors by preferring BPM in the musically common 80-180 range.
        let bpm = if bpm < 80.0 {
            (bpm * 2.0).min(180.0)
        } else if bpm > 180.0 {
            (bpm / 2.0).max(80.0)
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

            // Fold into 12 pitch classes with octave weighting
            for (bin, c) in spectrum.iter().enumerate().take(spectrum_len) {
                let freq =
                    bin as f64 * sample_rate as f64 / frame_size as f64;
                if freq < 27.5 || freq > 4186.0 {
                    continue; // Skip sub-bass and ultra-high
                }

                let magnitude = (c.re * c.re + c.im * c.im).sqrt() as f64;
                // MIDI note number from frequency
                let midi = 69.0 + 12.0 * (freq / 440.0).log2();

                // Weight lower octaves more — bass/fundamental defines key better
                let octave = (midi / 12.0).floor() as i32;
                let octave_weight = if octave <= 2 {
                    1.0 // Sub-bass / bass: highest weight
                } else if octave <= 4 {
                    0.8 // Mid range
                } else {
                    0.5 // High range: less weight
                };

                // Linear interpolation between adjacent pitch classes
                // instead of hard rounding for smoother chromagrams
                let midi_floor = midi.floor();
                let frac = midi - midi_floor;
                let pc_lower = ((midi_floor as i32) % 12 + 12) % 12;
                let pc_upper = (pc_lower + 1) % 12;
                let w_lower = 1.0 - frac;
                let w_upper = frac;

                chroma[pc_lower as usize] += magnitude * octave_weight * w_lower;
                chroma[pc_upper as usize] += magnitude * octave_weight * w_upper;
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
        let (samples, sample_rate, channels, duration_secs) =
            Self::decode_audio(file_path)?;

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

    /// Vocal characteristic analysis: estimates formant range, spectral brightness,
    /// dynamics range, presence peak, and low-end rumble from FFT spectrum.
    /// This is a heuristic estimation intended as guidance, not exact measurement.
    pub fn analyze_vocal_characteristics(file_path: &str) -> Result<crate::models::VocalAnalysisResult> {
        let (samples, sample_rate, _channels, duration_secs) =
            Self::decode_audio(file_path)?;

        if samples.is_empty() {
            return Err(crate::error::BeatPartnerError::AudioAnalysis(
                "No audio data to analyze".to_string(),
            ));
        }

        // Compute average spectrum for spectral analysis
        let fft_size = 4096;
        let spectrum = Self::compute_spectrum(&samples, sample_rate, fft_size)?;
        let freq_res = spectrum.frequency_resolution as f64;
        let mags = &spectrum.magnitudes;

        // --- Spectral brightness ---
        // Ratio of energy above 4kHz vs below 4kHz
        let mut low_energy = 0.0f64;
        let mut high_energy = 0.0f64;
        for (i, &mag) in mags.iter().enumerate() {
            let freq = i as f64 * freq_res;
            let energy = (mag as f64).powi(2);
            if freq < 4000.0 {
                low_energy += energy;
            } else if freq <= 16000.0 {
                high_energy += energy;
            }
        }
        let brightness_ratio = if low_energy > 0.0 {
            high_energy / low_energy
        } else { 0.0 };
        let spectral_brightness = if brightness_ratio < 0.05 {
            "dark".to_string()
        } else if brightness_ratio < 0.15 {
            "warm".to_string()
        } else if brightness_ratio < 0.35 {
            "bright".to_string()
        } else {
            "harsh".to_string()
        };

        // --- Formant estimation ---
        // Look for dominant peaks in the vocal formant range (500Hz–4kHz)
        let formant_start = (500.0 / freq_res) as usize;
        let formant_end = (4000.0 / freq_res).min(mags.len() as f64) as usize;
        let mut formant_band_energy = vec![0.0f64; formant_end.saturating_sub(formant_start)];
        for i in formant_start..formant_end {
            formant_band_energy[i - formant_start] = mags[i] as f64;
        }
        // Find the frequency with highest energy in formant range
        let mut dominant_formant_freq = 0.0;
        let mut max_formant_energy = 0.0;
        for (idx, &energy) in formant_band_energy.iter().enumerate() {
            if energy > max_formant_energy {
                max_formant_energy = energy;
                dominant_formant_freq = (formant_start + idx) as f64 * freq_res;
            }
        }
        // Map dominant formant freq to a rough note range
        let estimated_formant_range = if dominant_formant_freq < 700.0 {
            "C3–F3".to_string()
        } else if dominant_formant_freq < 1000.0 {
            "F3–A3".to_string()
        } else if dominant_formant_freq < 1400.0 {
            "A3–C4".to_string()
        } else if dominant_formant_freq < 2000.0 {
            "C4–F4".to_string()
        } else if dominant_formant_freq < 2800.0 {
            "F4–A4".to_string()
        } else {
            "A4–C5".to_string()
        };

        // --- Presence peak (2–5kHz) ---
        let presence_start = (2000.0 / freq_res) as usize;
        let presence_end = (5000.0 / freq_res).min(mags.len() as f64) as usize;
        let mut presence_sum = 0.0f64;
        let mut presence_count = 0usize;
        for i in presence_start..presence_end {
            presence_sum += mags[i] as f64;
            presence_count += 1;
        }
        let presence_peak_db = if presence_count > 0 {
            presence_sum / presence_count as f64
        } else { -100.0 };

        // --- Low-end rumble (<100Hz) ---
        let rumble_end = (100.0 / freq_res).min(mags.len() as f64) as usize;
        let mut rumble_sum = 0.0f64;
        let mut rumble_count = 0usize;
        for i in 0..rumble_end {
            rumble_sum += mags[i] as f64;
            rumble_count += 1;
        }
        let low_end_rumble_db = if rumble_count > 0 {
            rumble_sum / rumble_count as f64
        } else { -100.0 };

        // --- Dynamics range ---
        // Compute RMS in short windows and find range between loudest and softest
        let window_size = (sample_rate as usize / 10).max(1024); // 100ms windows
        let mut rms_values = Vec::new();
        for chunk in samples.chunks(window_size) {
            let sum_sq: f32 = chunk.iter().map(|&s| s * s).sum();
            let rms = (sum_sq / chunk.len() as f32).sqrt();
            if rms > 1e-6 {
                // Convert to dB
                let db = 20.0 * rms.log10();
                rms_values.push(db);
            }
        }
        let dynamics_range_db = if rms_values.len() >= 2 {
            let max_db = rms_values.iter().cloned().fold(f32::NEG_INFINITY, f32::max) as f64;
            let min_db = rms_values.iter().cloned().fold(f32::INFINITY, f32::min) as f64;
            (max_db - min_db).max(0.0)
        } else {
            0.0
        };
        let dynamics_character = if dynamics_range_db < 6.0 {
            "compressed".to_string()
        } else if dynamics_range_db < 14.0 {
            "dynamic".to_string()
        } else {
            "inconsistent".to_string()
        };

        Ok(crate::models::VocalAnalysisResult {
            file_path: file_path.to_string(),
            duration_secs,
            estimated_formant_range,
            spectral_brightness,
            dynamics_range_db,
            dynamics_character,
            presence_peak_db,
            low_end_rumble_db,
            analyzed_at: chrono::Utc::now().to_rfc3339(),
        })
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
    fn test_detect_bpm_octave_error_correction() {
        // Generate a click track at 128 BPM where sub-harmonic (64 BPM)
        // might score higher without octave correction.
        let sample_rate = 44100u32;
        let bpm = 128.0;
        let duration_secs = 12.0;
        let total_samples = (sample_rate as f64 * duration_secs) as usize;
        let samples_per_beat = (sample_rate as f64 * 60.0 / bpm) as usize;

        let mut samples = vec![0.0f32; total_samples];
        let click_len = 150;

        for beat in 0..(duration_secs * bpm / 60.0) as usize {
            let start = beat * samples_per_beat;
            for j in 0..click_len.min(total_samples - start) {
                samples[start + j] = if j % 2 == 0 { 0.9 } else { -0.9 };
            }
        }

        let detected = AudioService::detect_bpm(&samples, sample_rate).unwrap();
        assert!(
            (detected - bpm).abs() < 5.0,
            "Expected ~{} BPM, got {} BPM (octave error not corrected)",
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

    #[test]
    fn test_vocal_analysis_silence() {
        // Silence should produce predictable "dark"/"inconsistent" characteristics
        let sample_rate = 44100u32;
        let samples = vec![0.0f32; sample_rate as usize * 2]; // 2 seconds of silence

        // We can't call analyze_vocal_characteristics directly without a file,
        // so we test the spectrum computation that underlies it.
        let spectrum = AudioService::compute_spectrum(&samples, sample_rate, 4096).unwrap();
        // All magnitudes should be at floor (-100 dB)
        for &mag in &spectrum.magnitudes {
            assert!((mag - (-100.0)).abs() < 0.1, "Expected silence floor at -100dB, got {}", mag);
        }
    }

    #[test]
    fn test_vocal_analysis_tone() {
        // Generate a 1kHz sine wave — should produce a bright spectral profile
        let sample_rate = 44100u32;
        let freq = 1000.0f32;
        let duration_secs = 2.0;
        let total_samples = (sample_rate as f64 * duration_secs) as usize;

        let samples: Vec<f32> = (0..total_samples)
            .map(|i| {
                let t = i as f32 / sample_rate as f32;
                (2.0 * std::f32::consts::PI * freq * t).sin() * 0.5
            })
            .collect();

        let spectrum = AudioService::compute_spectrum(&samples, sample_rate, 4096).unwrap();

        // Find peak frequency bin
        let peak_bin = spectrum
            .magnitudes
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
            .map(|(i, _)| i)
            .unwrap_or(0);

        let peak_freq = peak_bin as f32 * spectrum.frequency_resolution;

        // Should detect peak near 1kHz (within one bin)
        assert!(
            (peak_freq - freq).abs() < spectrum.frequency_resolution * 2.0,
            "Expected peak near {} Hz, got {} Hz",
            freq,
            peak_freq
        );
    }
}
