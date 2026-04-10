use rusqlite::params;

use crate::db::Database;
use crate::error::Result;
use crate::models::Project;

pub struct ProjectService;

impl ProjectService {
    pub fn list(db: &Database) -> Result<Vec<Project>> {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, bpm, key, genre, phase, notes, created_at, updated_at
             FROM projects ORDER BY updated_at DESC",
        )?;

        let projects = stmt
            .query_map([], |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    bpm: row.get(2)?,
                    key: row.get(3)?,
                    genre: row.get(4)?,
                    phase: row.get(5)?,
                    notes: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(projects)
    }

    pub fn get_by_id(db: &Database, id: i64) -> Result<Option<Project>> {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, bpm, key, genre, phase, notes, created_at, updated_at
             FROM projects WHERE id = ?1",
        )?;

        let result = stmt.query_row(params![id], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                bpm: row.get(2)?,
                key: row.get(3)?,
                genre: row.get(4)?,
                phase: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        });

        match result {
            Ok(project) => Ok(Some(project)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn create(db: &Database, name: &str) -> Result<Project> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO projects (name) VALUES (?1)",
            params![name],
        )?;

        let id = conn.last_insert_rowid();

        let mut stmt = conn.prepare(
            "SELECT id, name, bpm, key, genre, phase, notes, created_at, updated_at
             FROM projects WHERE id = ?1",
        )?;

        let project = stmt.query_row(params![id], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                bpm: row.get(2)?,
                key: row.get(3)?,
                genre: row.get(4)?,
                phase: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        Ok(project)
    }

    pub fn update(db: &Database, project: &Project) -> Result<Project> {
        let conn = db.conn.lock().unwrap();
        let id = project.id.ok_or_else(|| {
            crate::error::BeatPartnerError::Config("Project ID is required for update".to_string())
        })?;

        conn.execute(
            "UPDATE projects SET
                name = ?1,
                bpm = ?2,
                key = ?3,
                genre = ?4,
                phase = ?5,
                notes = ?6,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?7",
            params![
                project.name,
                project.bpm,
                project.key,
                project.genre,
                project.phase,
                project.notes,
                id
            ],
        )?;

        Self::get_by_id(db, id).map(|p| p.unwrap())
    }

    pub fn delete(db: &Database, id: i64) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
        Ok(())
    }
}
