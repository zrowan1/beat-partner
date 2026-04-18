-- Vocal Production Notes (per project)
CREATE TABLE vocal_production_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  mic_choice TEXT,
  vocal_chain_json TEXT,
  recording_notes TEXT,
  editing_notes TEXT,
  tuning_notes TEXT,
  checklist_json TEXT DEFAULT '[]',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_vocal_notes_project ON vocal_production_notes(project_id);

-- Reference Vocals (per project)
CREATE TABLE reference_vocals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  artist_name TEXT,
  bpm REAL,
  key TEXT,
  duration_secs REAL NOT NULL DEFAULT 0,
  notes TEXT,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_reference_vocals_project ON reference_vocals(project_id);
