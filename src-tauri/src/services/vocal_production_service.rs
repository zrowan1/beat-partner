use rusqlite::params;

use crate::db::Database;
use crate::error::Result;
use crate::models::{default_checklist, ReferenceVocal, VocalChain, VocalProductionNotes};
use crate::services::AudioService;

pub struct VocalProductionService;

impl VocalProductionService {
    pub fn get_or_create_notes(db: &Database, project_id: i64) -> Result<VocalProductionNotes> {
        let conn = db.conn.lock().unwrap();

        let existing = conn.query_row(
            "SELECT id, project_id, mic_choice, vocal_chain_json, recording_notes, editing_notes, tuning_notes, checklist_json, updated_at \
             FROM vocal_production_notes WHERE project_id = ?1",
            params![project_id],
            |row| {
                let vocal_chain_json: String = row.get(3).unwrap_or_default();
                let checklist_json: String = row.get(7).unwrap_or_else(|_| "[]".to_string());

                let vocal_chain: VocalChain = serde_json::from_str(&vocal_chain_json)
                    .unwrap_or_default();
                let checklist = serde_json::from_str(&checklist_json)
                    .unwrap_or_else(|_| default_checklist());

                Ok(VocalProductionNotes {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    mic_choice: row.get(2)?,
                    vocal_chain,
                    recording_notes: row.get(4)?,
                    editing_notes: row.get(5)?,
                    tuning_notes: row.get(6)?,
                    checklist,
                    updated_at: row.get(8)?,
                })
            },
        );

        match existing {
            Ok(notes) => Ok(notes),
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                let checklist = default_checklist();
                let checklist_json = serde_json::to_string(&checklist).unwrap_or_else(|_| "[]".to_string());
                let vocal_chain_json = serde_json::to_string(&VocalChain::default()).unwrap_or_else(|_| "{}".to_string());

                conn.execute(
                    "INSERT INTO vocal_production_notes (project_id, mic_choice, vocal_chain_json, recording_notes, editing_notes, tuning_notes, checklist_json) \
                     VALUES (?1, '', ?2, '', '', '', ?3)",
                    params![project_id, vocal_chain_json, checklist_json],
                )?;

                let id = conn.last_insert_rowid();

                Ok(VocalProductionNotes {
                    id: Some(id),
                    project_id,
                    mic_choice: Some(String::new()),
                    vocal_chain: VocalChain::default(),
                    recording_notes: Some(String::new()),
                    editing_notes: Some(String::new()),
                    tuning_notes: Some(String::new()),
                    checklist,
                    updated_at: None,
                })
            }
            Err(e) => Err(e.into()),
        }
    }

    pub fn update_notes(db: &Database, notes: &VocalProductionNotes) -> Result<VocalProductionNotes> {
        let conn = db.conn.lock().unwrap();

        let vocal_chain_json = serde_json::to_string(&notes.vocal_chain).unwrap_or_else(|_| "{}".to_string());
        let checklist_json = serde_json::to_string(&notes.checklist).unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "UPDATE vocal_production_notes \
             SET mic_choice = ?1, vocal_chain_json = ?2, recording_notes = ?3, editing_notes = ?4, tuning_notes = ?5, checklist_json = ?6, updated_at = CURRENT_TIMESTAMP \
             WHERE id = ?7",
            params![
                notes.mic_choice.as_ref(),
                vocal_chain_json,
                notes.recording_notes.as_ref(),
                notes.editing_notes.as_ref(),
                notes.tuning_notes.as_ref(),
                checklist_json,
                notes.id,
            ],
        )?;

        conn.query_row(
            "SELECT id, project_id, mic_choice, vocal_chain_json, recording_notes, editing_notes, tuning_notes, checklist_json, updated_at \
             FROM vocal_production_notes WHERE id = ?1",
            params![notes.id],
            |row| {
                let vocal_chain_json: String = row.get(3).unwrap_or_default();
                let checklist_json: String = row.get(7).unwrap_or_else(|_| "[]".to_string());

                let vocal_chain: VocalChain = serde_json::from_str(&vocal_chain_json)
                    .unwrap_or_default();
                let checklist = serde_json::from_str(&checklist_json)
                    .unwrap_or_else(|_| default_checklist());

                Ok(VocalProductionNotes {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    mic_choice: row.get(2)?,
                    vocal_chain,
                    recording_notes: row.get(4)?,
                    editing_notes: row.get(5)?,
                    tuning_notes: row.get(6)?,
                    checklist,
                    updated_at: row.get(8)?,
                })
            },
        )
        .map_err(|e| e.into())
    }

    pub fn update_checklist(db: &Database, project_id: i64, checklist: Vec<crate::models::ChecklistItem>) -> Result<VocalProductionNotes> {
        let conn = db.conn.lock().unwrap();

        let checklist_json = serde_json::to_string(&checklist).unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "UPDATE vocal_production_notes \
             SET checklist_json = ?1, updated_at = CURRENT_TIMESTAMP \
             WHERE project_id = ?2",
            params![checklist_json, project_id],
        )?;

        // Return updated notes
        Self::get_or_create_notes(db, project_id)
    }

    pub fn list_reference_vocals(db: &Database, project_id: i64) -> Result<Vec<ReferenceVocal>> {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, project_id, file_path, file_name, artist_name, bpm, key, duration_secs, notes, added_at \
             FROM reference_vocals WHERE project_id = ?1 ORDER BY added_at DESC",
        )?;

        let vocals = stmt
            .query_map(params![project_id], |row| {
                Ok(ReferenceVocal {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    file_path: row.get(2)?,
                    file_name: row.get(3)?,
                    artist_name: row.get(4)?,
                    bpm: row.get(5)?,
                    key: row.get(6)?,
                    duration_secs: row.get(7)?,
                    notes: row.get(8)?,
                    added_at: row.get(9)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(vocals)
    }

    pub fn add_reference_vocal(
        db: &Database,
        project_id: i64,
        file_path: String,
        artist_name: Option<String>,
        notes: Option<String>,
    ) -> Result<ReferenceVocal> {
        let file_name = std::path::Path::new(&file_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Analyze the file for BPM/key/duration
        let analysis = AudioService::analyze_file(&file_path).ok();

        let bpm = analysis.as_ref().and_then(|a| a.bpm);
        let key = analysis.as_ref().and_then(|a| a.key.clone());
        let duration_secs = analysis.as_ref().map(|a| a.duration_secs).unwrap_or(0.0);

        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO reference_vocals (project_id, file_path, file_name, artist_name, bpm, key, duration_secs, notes) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![project_id, file_path, file_name, artist_name, bpm, key, duration_secs, notes],
        )?;

        let id = conn.last_insert_rowid();

        Ok(ReferenceVocal {
            id: Some(id),
            project_id,
            file_path,
            file_name,
            artist_name,
            bpm,
            key,
            duration_secs,
            notes,
            added_at: Some(chrono::Utc::now().to_rfc3339()),
        })
    }

    pub fn delete_reference_vocal(db: &Database, id: i64) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        conn.execute("DELETE FROM reference_vocals WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn update_reference_vocal(db: &Database, vocal: &ReferenceVocal) -> Result<ReferenceVocal> {
        let id = vocal.id.ok_or_else(|| {
            crate::error::BeatPartnerError::Config(
                "Reference vocal ID is required for update".to_string(),
            )
        })?;

        let conn = db.conn.lock().unwrap();
        conn.execute(
            "UPDATE reference_vocals \
             SET artist_name = ?1, notes = ?2 \
             WHERE id = ?3",
            params![vocal.artist_name, vocal.notes, id],
        )?;

        conn.query_row(
            "SELECT id, project_id, file_path, file_name, artist_name, bpm, key, duration_secs, notes, added_at \
             FROM reference_vocals WHERE id = ?1",
            params![id],
            |row| {
                Ok(ReferenceVocal {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    file_path: row.get(2)?,
                    file_name: row.get(3)?,
                    artist_name: row.get(4)?,
                    bpm: row.get(5)?,
                    key: row.get(6)?,
                    duration_secs: row.get(7)?,
                    notes: row.get(8)?,
                    added_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| e.into())
    }
}
