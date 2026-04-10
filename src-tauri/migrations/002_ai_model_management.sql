-- Ollama modellen cache (voor snelle lookup zonder Ollama API call)
CREATE TABLE ollama_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  size_bytes INTEGER NOT NULL,
  parameter_count TEXT,
  use_cases TEXT,              -- JSON array of ModelUseCase
  quantization TEXT,
  downloaded_at DATETIME,
  last_used_at DATETIME,
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Model download geschiedenis
CREATE TABLE model_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT NOT NULL,
  status TEXT NOT NULL,        -- 'pending', 'downloading', 'completed', 'failed', 'cancelled'
  bytes_total INTEGER,
  bytes_downloaded INTEGER,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  error_message TEXT,
  FOREIGN KEY (model_id) REFERENCES ollama_models(id)
);

-- Default model preferences per use case
CREATE TABLE model_preferences (
  use_case TEXT PRIMARY KEY,
  preferred_model_id TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
