ALTER TABLE stories ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_stories_active_published
  ON stories (is_active, published_at DESC);
