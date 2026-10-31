ALTER TABLE stories ADD COLUMN owner_user_id TEXT;
ALTER TABLE story_drafts ADD COLUMN owner_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_stories_owner_published
  ON stories (owner_user_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_drafts_owner_updated
  ON story_drafts (owner_user_id, updated_at DESC);
