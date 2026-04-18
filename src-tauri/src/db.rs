use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};
use std::path::PathBuf;
use std::sync::Mutex;

use crate::error::Result;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_dir: PathBuf) -> Result<Self> {
        std::fs::create_dir_all(&app_dir)?;

        let db_path = app_dir.join("beatpartner.db");
        let mut conn = Connection::open(db_path)?;

        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;

        Self::run_migrations(&mut conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    fn run_migrations(conn: &mut Connection) -> Result<()> {
        let migrations = Migrations::new(vec![
            M::up(include_str!("../migrations/001_initial_schema.sql")),
            M::up(include_str!("../migrations/002_ai_model_management.sql")),
            M::up(include_str!("../migrations/003_reference_tracks.sql")),
            M::up(include_str!("../migrations/004_lyrics.sql")),
            M::up(include_str!("../migrations/005_vocal_production.sql")),
        ]);

        migrations.to_latest(conn)?;
        Ok(())
    }
}
