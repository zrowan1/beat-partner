use rusqlite::params;

use crate::db::Database;
use crate::error::Result;

pub struct SettingsService;

impl SettingsService {
    pub fn get(db: &Database, key: &str) -> Result<Option<String>> {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;

        let result = stmt.query_row(params![key], |row| row.get(0));

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn set(db: &Database, key: &str, value: &str) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_all(db: &Database) -> Result<Vec<(String, String)>> {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT key, value FROM settings ORDER BY key")?;

        let settings = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            ?.collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(settings)
    }
}
