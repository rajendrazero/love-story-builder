CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  password_salt TEXT,
  password_hash TEXT,
  published_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories (published_at);
