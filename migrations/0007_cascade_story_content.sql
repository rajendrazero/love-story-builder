CREATE TRIGGER delete_published_story_content
AFTER DELETE ON stories
BEGIN
  DELETE FROM story_content WHERE id = OLD.content_id;
END;

CREATE TRIGGER delete_story_draft_content
AFTER DELETE ON story_drafts
BEGIN
  DELETE FROM story_content WHERE id = OLD.id;
END;
