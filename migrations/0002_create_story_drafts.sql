CREATE TABLE IF NOT EXISTS story_drafts (
  id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  published_slug TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_story_drafts_updated_at ON story_drafts (updated_at);
