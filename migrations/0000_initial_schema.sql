-- Images table - stores basic metadata about uploaded images
CREATE TABLE images (
  uuid TEXT PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,  -- Public-facing ID for URL access
  cloudflare_id TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  workspace_id TEXT NOT NULL,
  collection_id TEXT,
  source_url TEXT,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Collections table - organizes images into logical groups
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Workspaces table - top level organizational structure
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX idx_images_workspace ON images(workspace_id);
CREATE INDEX idx_images_collection ON images(collection_id);
CREATE INDEX idx_collections_workspace ON collections(workspace_id); 