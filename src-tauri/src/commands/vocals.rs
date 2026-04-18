use tauri::State;

use crate::db::Database;
use crate::error::Result;
use crate::models::{ChecklistItem, CompingProgress, ReferenceVocal, TuningTimingProgress, VocalProductionNotes};
use crate::services::{AudioService, VocalProductionService};

#[tauri::command]
pub fn get_vocal_production_notes(db: State<'_, Database>, project_id: i64) -> Result<VocalProductionNotes> {
    VocalProductionService::get_or_create_notes(&db, project_id)
}

#[tauri::command]
pub fn update_vocal_production_notes(
    db: State<'_, Database>,
    notes: VocalProductionNotes,
) -> Result<VocalProductionNotes> {
    VocalProductionService::update_notes(&db, &notes)
}

#[tauri::command]
pub fn update_recording_checklist(
    db: State<'_, Database>,
    project_id: i64,
    checklist: Vec<ChecklistItem>,
) -> Result<VocalProductionNotes> {
    VocalProductionService::update_checklist(&db, project_id, checklist)
}

#[tauri::command]
pub fn update_comping_progress(
    db: State<'_, Database>,
    project_id: i64,
    progress: CompingProgress,
) -> Result<VocalProductionNotes> {
    VocalProductionService::update_comping_progress(&db, project_id, &progress)
}

#[tauri::command]
pub fn update_tuning_timing_progress(
    db: State<'_, Database>,
    project_id: i64,
    progress: TuningTimingProgress,
) -> Result<VocalProductionNotes> {
    VocalProductionService::update_tuning_timing_progress(&db, project_id, &progress)
}

#[tauri::command]
pub fn analyze_vocal_file(file_path: String) -> Result<crate::models::VocalAnalysisResult> {
    AudioService::analyze_vocal_characteristics(&file_path)
}

#[tauri::command]
pub fn list_reference_vocals(db: State<'_, Database>, project_id: i64) -> Result<Vec<ReferenceVocal>> {
    VocalProductionService::list_reference_vocals(&db, project_id)
}

#[tauri::command]
pub fn add_reference_vocal(
    db: State<'_, Database>,
    project_id: i64,
    file_path: String,
    artist_name: Option<String>,
    notes: Option<String>,
) -> Result<ReferenceVocal> {
    VocalProductionService::add_reference_vocal(&db, project_id, file_path, artist_name, notes)
}

#[tauri::command]
pub fn delete_reference_vocal(db: State<'_, Database>, id: i64) -> Result<()> {
    VocalProductionService::delete_reference_vocal(&db, id)
}

#[tauri::command]
pub fn update_reference_vocal(
    db: State<'_, Database>,
    vocal: ReferenceVocal,
) -> Result<ReferenceVocal> {
    VocalProductionService::update_reference_vocal(&db, &vocal)
}
