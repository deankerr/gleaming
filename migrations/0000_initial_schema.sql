-- Images table - stores basic metadata about uploaded images
CREATE TABLE images (
  id TEXT PRIMARY KEY, -- UUID
  public_id TEXT NOT NULL UNIQUE,  -- Public-facing ID, URL key
  storage_id TEXT NOT NULL,  -- Cloudflare R2 object ID
  
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  source_url TEXT,
  
  user_id TEXT NOT NULL,  -- user entity (planned)
  workspace_id TEXT NOT NULL,  -- workspace entity (planned)

  created_at INTEGER NOT NULL
);


-- Create indexes for faster queries
CREATE INDEX idx_images_workspace ON images(workspace_id);
