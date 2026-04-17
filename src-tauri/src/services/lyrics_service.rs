use rusqlite::params;

use crate::db::Database;
use crate::error::Result;
use crate::models::{LyricAnnotation, LyricTag, Lyrics};

pub struct LyricsService;

impl LyricsService {
    pub fn get_or_create_for_project(db: &Database, project_id: i64) -> Result<Lyrics> {
        let conn = db.conn.lock().unwrap();

        // Try to get existing lyrics
        let existing = conn.query_row(
            "SELECT id, project_id, content, updated_at FROM lyrics WHERE project_id = ?1",
            params![project_id],
            |row| {
                Ok(Lyrics {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    content: row.get(2)?,
                    updated_at: row.get(3)?,
                })
            },
        );

        match existing {
            Ok(lyrics) => Ok(lyrics),
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                // Create new lyrics entry
                conn.execute(
                    "INSERT INTO lyrics (project_id, content) VALUES (?1, '')",
                    params![project_id],
                )?;

                let id = conn.last_insert_rowid();

                Ok(Lyrics {
                    id: Some(id),
                    project_id,
                    content: String::new(),
                    updated_at: None,
                })
            }
            Err(e) => Err(e.into()),
        }
    }

    pub fn update_content(db: &Database, lyrics_id: i64, content: &str) -> Result<Lyrics> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "UPDATE lyrics SET content = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
            params![content, lyrics_id],
        )?;

        conn.query_row(
            "SELECT id, project_id, content, updated_at FROM lyrics WHERE id = ?1",
            params![lyrics_id],
            |row| {
                Ok(Lyrics {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    content: row.get(2)?,
                    updated_at: row.get(3)?,
                })
            },
        )
        .map_err(|e| e.into())
    }

    pub fn list_annotations(db: &Database, lyrics_id: i64) -> Result<Vec<LyricAnnotation>> {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, lyrics_id, start_index, end_index, tag, color, note, created_at
             FROM lyric_annotations
             WHERE lyrics_id = ?1
             ORDER BY start_index ASC",
        )?;

        let annotations = stmt
            .query_map(params![lyrics_id], |row| {
                let tag_str: String = row.get(4)?;
                let tag = match tag_str.as_str() {
                    "melody" => LyricTag::Melody,
                    "ad-lib" => LyricTag::AdLib,
                    "harmony" => LyricTag::Harmony,
                    "flow" => LyricTag::Flow,
                    "emphasis" => LyricTag::Emphasis,
                    "note" => LyricTag::Note,
                    _ => LyricTag::Note,
                };

                Ok(LyricAnnotation {
                    id: row.get(0)?,
                    lyrics_id: row.get(1)?,
                    start_index: row.get(2)?,
                    end_index: row.get(3)?,
                    tag,
                    color: row.get(5)?,
                    note: row.get(6)?,
                    created_at: row.get(7)?,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(annotations)
    }

    pub fn create_annotation(
        db: &Database,
        lyrics_id: i64,
        start_index: i64,
        end_index: i64,
        tag: LyricTag,
        note: Option<&str>,
    ) -> Result<LyricAnnotation> {
        let conn = db.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO lyric_annotations (lyrics_id, start_index, end_index, tag, note)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                lyrics_id,
                start_index,
                end_index,
                tag.as_str(),
                note
            ],
        )?;

        let id = conn.last_insert_rowid();

        Ok(LyricAnnotation {
            id: Some(id),
            lyrics_id,
            start_index,
            end_index,
            tag,
            color: None,
            note: note.map(|s| s.to_string()),
            created_at: None,
        })
    }

    pub fn delete_annotation(db: &Database, annotation_id: i64) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM lyric_annotations WHERE id = ?1",
            params![annotation_id],
        )?;
        Ok(())
    }

    pub fn update_annotation(
        db: &Database,
        annotation: &LyricAnnotation,
    ) -> Result<LyricAnnotation> {
        let id = annotation.id.ok_or_else(|| {
            crate::error::BeatPartnerError::Config(
                "Annotation ID is required for update".to_string(),
            )
        })?;

        let conn = db.conn.lock().unwrap();
        conn.execute(
            "UPDATE lyric_annotations
             SET start_index = ?1,
                 end_index = ?2,
                 tag = ?3,
                 note = ?4
             WHERE id = ?5",
            params![
                annotation.start_index,
                annotation.end_index,
                annotation.tag.as_str(),
                annotation.note.as_ref(),
                id
            ],
        )?;

        // Return the updated annotation
        let updated = conn.query_row(
            "SELECT id, lyrics_id, start_index, end_index, tag, color, note, created_at
             FROM lyric_annotations WHERE id = ?1",
            params![id],
            |row| {
                let tag_str: String = row.get(4)?;
                let tag = match tag_str.as_str() {
                    "melody" => LyricTag::Melody,
                    "ad-lib" => LyricTag::AdLib,
                    "harmony" => LyricTag::Harmony,
                    "flow" => LyricTag::Flow,
                    "emphasis" => LyricTag::Emphasis,
                    "note" => LyricTag::Note,
                    _ => LyricTag::Note,
                };

                Ok(LyricAnnotation {
                    id: row.get(0)?,
                    lyrics_id: row.get(1)?,
                    start_index: row.get(2)?,
                    end_index: row.get(3)?,
                    tag,
                    color: row.get(5)?,
                    note: row.get(6)?,
                    created_at: row.get(7)?,
                })
            },
        )?;

        Ok(updated)
    }
}
