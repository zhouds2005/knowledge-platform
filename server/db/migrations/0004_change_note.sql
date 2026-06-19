-- Add change_note field for version descriptions
ALTER TABLE knowledge_objects ADD COLUMN IF NOT EXISTS change_note TEXT;
