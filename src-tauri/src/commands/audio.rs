use tauri::{ipc::Channel, State};

use crate::db::Database;
use crate::error::Result;
use crate::models::{AnalysisProgress, AudioAnalysisResult, ReferenceTrack, SpectrumData};
use crate::services::AudioService;

#[tauri::command]
pub async fn analyze_audio_file(
    db: State<'_, Database>,
    file_path: String,
    on_progress: Channel<AnalysisProgress>,
) -> Result<AudioAnalysisResult> {
    let _ = on_progress.send(AnalysisProgress::Decoding { percent: 0.0 });

    let db_ref = &*db;
    let file_path_clone = file_path.clone();

    // Run analysis in a blocking thread (CPU-intensive)
    let result = tokio::task::spawn_blocking(move || {
        AudioService::analyze_file(&file_path_clone)
    })
    .await
    .map_err(|e| {
        crate::error::BeatPartnerError::AudioAnalysis(format!("Task error: {}", e))
    })??;

    // Cache result
    if let Ok(hash) = AudioService::file_hash(&file_path) {
        if let Ok(json) = serde_json::to_string(&result) {
            let _ = AudioService::store_cache(db_ref, &file_path, &hash, "full", &json);
        }
    }

    let _ = on_progress.send(AnalysisProgress::Complete {
        result: result.clone(),
    });

    Ok(result)
}

#[tauri::command]
pub async fn get_audio_spectrum(
    file_path: String,
    fft_size: Option<usize>,
) -> Result<SpectrumData> {
    let fft_size = fft_size.unwrap_or(4096);

    tokio::task::spawn_blocking(move || {
        let (samples, sample_rate, _channels) = AudioService::decode_audio(&file_path)?;
        AudioService::compute_spectrum(&samples, sample_rate, fft_size)
    })
    .await
    .map_err(|e| {
        crate::error::BeatPartnerError::AudioAnalysis(format!("Task error: {}", e))
    })?
}

#[tauri::command]
pub fn add_reference_track(
    db: State<'_, Database>,
    project_id: i64,
    file_path: String,
) -> Result<ReferenceTrack> {
    // Extract file name from path
    let file_name = std::path::Path::new(&file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    // Analyze the file for BPM/key
    let analysis = AudioService::analyze_file(&file_path).ok();

    let bpm = analysis.as_ref().and_then(|a| a.bpm);
    let key = analysis.as_ref().and_then(|a| a.key.clone());
    let duration_secs = analysis.as_ref().map(|a| a.duration_secs).unwrap_or(0.0);

    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO reference_tracks (project_id, file_path, file_name, bpm, key, duration_secs) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![project_id, file_path, file_name, bpm, key, duration_secs],
    )?;

    let id = conn.last_insert_rowid();

    Ok(ReferenceTrack {
        id: Some(id),
        project_id,
        file_path,
        file_name,
        bpm,
        key,
        duration_secs,
        added_at: Some(chrono::Utc::now().to_rfc3339()),
    })
}

#[tauri::command]
pub fn list_reference_tracks(
    db: State<'_, Database>,
    project_id: i64,
) -> Result<Vec<ReferenceTrack>> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, project_id, file_path, file_name, bpm, key, duration_secs, added_at \
         FROM reference_tracks WHERE project_id = ?1 ORDER BY added_at DESC",
    )?;

    let tracks = stmt
        .query_map(rusqlite::params![project_id], |row| {
            Ok(ReferenceTrack {
                id: row.get(0)?,
                project_id: row.get(1)?,
                file_path: row.get(2)?,
                file_name: row.get(3)?,
                bpm: row.get(4)?,
                key: row.get(5)?,
                duration_secs: row.get(6)?,
                added_at: row.get(7)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tracks)
}

#[tauri::command]
pub fn delete_reference_track(
    db: State<'_, Database>,
    id: i64,
) -> Result<()> {
    let conn = db.conn.lock().unwrap();
    conn.execute("DELETE FROM reference_tracks WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
}
