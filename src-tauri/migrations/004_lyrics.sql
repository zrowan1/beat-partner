-- Lyrics (per project, one active version)
CREATE TABLE lyrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_lyrics_project ON lyrics(project_id);

-- Lyric Annotations (highlights: melody, ad-lib, flow, harmony, etc.)
CREATE TABLE lyric_annotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lyrics_id INTEGER NOT NULL,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  tag TEXT NOT NULL CHECK(tag IN ('melody','ad-lib','harmony','flow','emphasis','note')),
  color TEXT,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lyrics_id) REFERENCES lyrics(id) ON DELETE CASCADE
);

CREATE INDEX idx_lyric_annotations_lyrics ON lyric_annotations(lyrics_id);
