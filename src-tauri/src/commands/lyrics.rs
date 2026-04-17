use tauri::State;

use crate::db::Database;
use crate::error::Result;
use crate::models::{LyricAnnotation, LyricTag, Lyrics};
use crate::services::LyricsService;

#[tauri::command]
pub fn get_lyrics(db: State<'_, Database>, project_id: i64) -> Result<Lyrics> {
    LyricsService::get_or_create_for_project(&db, project_id)
}

#[tauri::command]
pub fn update_lyrics_content(
    db: State<'_, Database>,
    lyrics_id: i64,
    content: String,
) -> Result<Lyrics> {
    LyricsService::update_content(&db, lyrics_id, &content)
}

#[tauri::command]
pub fn list_lyric_annotations(
    db: State<'_, Database>,
    lyrics_id: i64,
) -> Result<Vec<LyricAnnotation>> {
    LyricsService::list_annotations(&db, lyrics_id)
}

#[tauri::command]
pub fn create_lyric_annotation(
    db: State<'_, Database>,
    lyrics_id: i64,
    start_index: i64,
    end_index: i64,
    tag: LyricTag,
    note: Option<String>,
) -> Result<LyricAnnotation> {
    LyricsService::create_annotation(&db, lyrics_id, start_index, end_index, tag, note.as_deref())
}

#[tauri::command]
pub fn delete_lyric_annotation(db: State<'_, Database>, annotation_id: i64) -> Result<()> {
    LyricsService::delete_annotation(&db, annotation_id)
}

#[tauri::command]
pub fn update_lyric_annotation(
    db: State<'_, Database>,
    annotation: LyricAnnotation,
) -> Result<LyricAnnotation> {
    LyricsService::update_annotation(&db, &annotation)
}
