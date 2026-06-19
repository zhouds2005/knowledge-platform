-- Knowledge file versions: track file attachments per version
CREATE TABLE IF NOT EXISTS knowledge_file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_hash VARCHAR(128),
  file_name VARCHAR(500),
  file_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kfv_object ON knowledge_file_versions(object_id);
