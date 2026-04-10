-- App Preferences (key-value store)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bpm INTEGER DEFAULT 128,
  key TEXT,
  genre TEXT,
  phase TEXT DEFAULT 'idea',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_updated ON projects(updated_at);

-- Progress Tracking
CREATE TABLE progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  phase TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, phase)
);

CREATE INDEX idx_progress_project ON progress(project_id);

-- Tags
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Samples Library
CREATE TABLE samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  category TEXT,
  bpm INTEGER,
  key TEXT,
  duration REAL,
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_samples_category ON samples(category);

CREATE TABLE sample_tags (
  sample_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (sample_id, tag_id),
  FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Presets
CREATE TABLE presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  synth_name TEXT NOT NULL,
  category TEXT,
  settings_json TEXT NOT NULL,
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_presets_synth ON presets(synth_name);
CREATE INDEX idx_presets_category ON presets(category);

CREATE TABLE preset_tags (
  preset_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (preset_id, tag_id),
  FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- AI Conversations
CREATE TABLE ai_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_messages_project ON ai_messages(project_id);
CREATE INDEX idx_ai_messages_session ON ai_messages(session_id);

-- Audio Analysis Cache
CREATE TABLE audio_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  results_json TEXT NOT NULL,
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(file_path, analysis_type)
);

CREATE INDEX idx_audio_analysis_path ON audio_analysis(file_path);
CREATE INDEX idx_audio_hash ON audio_analysis(file_hash);
