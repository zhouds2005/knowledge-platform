-- Migration: Add tsvector search_vector column to knowledge_objects
-- Enables PostgreSQL full-text search for title, description, and tags.

BEGIN;

-- 1. Add the tsvector column (initially NULL)
ALTER TABLE knowledge_objects
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Populate existing rows
UPDATE knowledge_objects
SET search_vector =
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '), '')), 'C');

-- 3. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_knowledge_objects_search
  ON knowledge_objects
  USING gin (search_vector);

-- 4. Create trigger function to auto-update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION knowledge_objects_search_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger
DROP TRIGGER IF EXISTS trg_knowledge_objects_search ON knowledge_objects;
CREATE TRIGGER trg_knowledge_objects_search
  BEFORE INSERT OR UPDATE ON knowledge_objects
  FOR EACH ROW
  EXECUTE FUNCTION knowledge_objects_search_update();

COMMIT;
