CREATE TABLE uploaded_images (
  owner_user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (owner_user_id, url)
);

CREATE INDEX idx_uploaded_images_owner_created
  ON uploaded_images (owner_user_id, created_at DESC);
