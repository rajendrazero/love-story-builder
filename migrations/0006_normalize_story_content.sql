CREATE TABLE story_content (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL DEFAULT 'editorial-rose',
  cursor_preset TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL DEFAULT '',
  couple_names TEXT NOT NULL DEFAULT '',
  date_label TEXT NOT NULL DEFAULT '',
  hero_image TEXT NOT NULL DEFAULT '',
  greeting_image TEXT NOT NULL DEFAULT '',
  greeting_video_url TEXT NOT NULL DEFAULT '',
  greeting_text TEXT NOT NULL DEFAULT '',
  second_image TEXT NOT NULL DEFAULT '',
  detail_title TEXT NOT NULL DEFAULT '',
  detail_text TEXT NOT NULL DEFAULT '',
  final_image TEXT NOT NULL DEFAULT '',
  final_message TEXT NOT NULL DEFAULT '',
  music_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE story_template_editorial (
  content_id TEXT PRIMARY KEY REFERENCES story_content(id) ON DELETE CASCADE,
  dedication TEXT NOT NULL DEFAULT '',
  signature TEXT NOT NULL DEFAULT ''
);

CREATE TABLE story_template_cinema (
  content_id TEXT PRIMARY KEY REFERENCES story_content(id) ON DELETE CASCADE,
  opening_quote TEXT NOT NULL DEFAULT '',
  credits TEXT NOT NULL DEFAULT ''
);

CREATE TABLE story_template_botanical (
  content_id TEXT PRIMARY KEY REFERENCES story_content(id) ON DELETE CASCADE,
  journal_label TEXT NOT NULL DEFAULT '',
  field_note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE story_gallery_items (
  content_id TEXT NOT NULL REFERENCES story_content(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  url TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (content_id, position)
);

CREATE TABLE story_chapters (
  content_id TEXT NOT NULL REFERENCES story_content(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (content_id, position)
);

WITH records AS (
  SELECT id, payload_json, title AS legacy_title FROM stories
  UNION ALL
  SELECT id, payload_json, NULL AS legacy_title FROM story_drafts
)
INSERT INTO story_content (
  id, template_id, cursor_preset, title, couple_names, date_label,
  hero_image, greeting_image, greeting_video_url, greeting_text,
  second_image, detail_title, detail_text, final_image, final_message, music_url
)
SELECT
  id,
  COALESCE(json_extract(payload_json, '$.templateId'), 'editorial-rose'),
  COALESCE(json_extract(payload_json, '$.cursorPreset'), 'system'),
  COALESCE(legacy_title, json_extract(payload_json, '$.title'), ''),
  COALESCE(json_extract(payload_json, '$.coupleNames'), ''),
  COALESCE(json_extract(payload_json, '$.date'), ''),
  COALESCE(json_extract(payload_json, '$.heroImage'), ''),
  COALESCE(json_extract(payload_json, '$.greetingImage'), ''),
  COALESCE(json_extract(payload_json, '$.greetingVideoUrl'), ''),
  COALESCE(json_extract(payload_json, '$.greetingText'), ''),
  COALESCE(json_extract(payload_json, '$.secondImage'), ''),
  COALESCE(json_extract(payload_json, '$.detailTitle'), ''),
  COALESCE(json_extract(payload_json, '$.detailText'), ''),
  COALESCE(json_extract(payload_json, '$.finalImage'), ''),
  COALESCE(json_extract(payload_json, '$.finalMessage'), ''),
  COALESCE(json_extract(payload_json, '$.musicUrl'), '')
FROM records;

WITH records AS (
  SELECT id, payload_json FROM stories
  UNION ALL
  SELECT id, payload_json FROM story_drafts
)
INSERT INTO story_template_editorial (content_id, dedication, signature)
SELECT
  id,
  COALESCE(json_extract(payload_json, '$.templateDetails.editorialRose.dedication'), ''),
  COALESCE(json_extract(payload_json, '$.templateDetails.editorialRose.signature'), '')
FROM records
WHERE json_type(payload_json, '$.templateDetails.editorialRose') = 'object';

WITH records AS (
  SELECT id, payload_json FROM stories
  UNION ALL
  SELECT id, payload_json FROM story_drafts
)
INSERT INTO story_template_cinema (content_id, opening_quote, credits)
SELECT
  id,
  COALESCE(json_extract(payload_json, '$.templateDetails.midnightCinema.openingQuote'), ''),
  COALESCE(json_extract(payload_json, '$.templateDetails.midnightCinema.credits'), '')
FROM records
WHERE json_type(payload_json, '$.templateDetails.midnightCinema') = 'object';

WITH records AS (
  SELECT id, payload_json FROM stories
  UNION ALL
  SELECT id, payload_json FROM story_drafts
)
INSERT INTO story_template_botanical (content_id, journal_label, field_note)
SELECT
  id,
  COALESCE(json_extract(payload_json, '$.templateDetails.botanicalJournal.journalLabel'), ''),
  COALESCE(json_extract(payload_json, '$.templateDetails.botanicalJournal.fieldNote'), '')
FROM records
WHERE json_type(payload_json, '$.templateDetails.botanicalJournal') = 'object';

INSERT INTO story_gallery_items (content_id, position, url, caption)
SELECT
  source.id,
  CAST(photo.key AS INTEGER),
  COALESCE(json_extract(photo.value, '$.url'), ''),
  COALESCE(json_extract(photo.value, '$.caption'), '')
FROM (
  SELECT id, payload_json FROM stories
  UNION ALL
  SELECT id, payload_json FROM story_drafts
) AS source,
json_each(source.payload_json, '$.gallery') AS photo;

INSERT INTO story_chapters (content_id, position, title, body, image_url)
SELECT
  source.id,
  CAST(chapter.key AS INTEGER),
  COALESCE(json_extract(chapter.value, '$.title'), ''),
  COALESCE(json_extract(chapter.value, '$.text'), ''),
  COALESCE(json_extract(chapter.value, '$.image'), '')
FROM (
  SELECT id, payload_json FROM stories
  UNION ALL
  SELECT id, payload_json FROM story_drafts
) AS source,
json_each(source.payload_json, '$.storyPages') AS chapter;

ALTER TABLE stories RENAME TO stories_legacy;

CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  content_id TEXT NOT NULL UNIQUE REFERENCES story_content(id) ON DELETE CASCADE,
  password_salt TEXT,
  password_hash TEXT,
  owner_user_id TEXT,
  published_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

INSERT INTO stories (
  id, slug, content_id, password_salt, password_hash,
  owner_user_id, published_at, created_at, is_active
)
SELECT
  id, slug, id, password_salt, password_hash,
  owner_user_id, published_at, created_at, is_active
FROM stories_legacy;

DROP TABLE stories_legacy;

CREATE INDEX idx_stories_published_at ON stories (published_at);
CREATE INDEX idx_stories_owner_published ON stories (owner_user_id, published_at DESC);
CREATE INDEX idx_stories_active_published ON stories (is_active, published_at DESC);

ALTER TABLE story_drafts RENAME TO story_drafts_legacy;

CREATE TABLE story_drafts (
  id TEXT PRIMARY KEY REFERENCES story_content(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  published_slug TEXT,
  owner_user_id TEXT,
  active_step INTEGER NOT NULL DEFAULT 0,
  editing_slug TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO story_drafts (
  id, key_hash, published_slug, owner_user_id,
  active_step, editing_slug, created_at, updated_at
)
SELECT
  id, key_hash, published_slug, owner_user_id,
  COALESCE(CAST(json_extract(payload_json, '$.activeStep') AS INTEGER), 0),
  json_extract(payload_json, '$.editingSlug'),
  created_at,
  updated_at
FROM story_drafts_legacy;

DROP TABLE story_drafts_legacy;

CREATE INDEX idx_story_drafts_updated_at ON story_drafts (updated_at);
CREATE INDEX idx_story_drafts_owner_updated ON story_drafts (owner_user_id, updated_at DESC);
