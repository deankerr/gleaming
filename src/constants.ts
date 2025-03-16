/**
 * Shared constants for the Gleaming Images service
 *
 * These constants are used across the codebase to ensure consistency
 * between the worker and scripts.
 */

// Default workspace and user IDs
export const DEFAULT_WORKSPACE_ID = 'default-workspace'
export const DEFAULT_USER_ID = 'default-user'

// Database table names
export const DB_TABLE_WORKSPACES = 'workspaces'
export const DB_TABLE_COLLECTIONS = 'collections'
export const DB_TABLE_IMAGES = 'images'

// Environment names
export const ENV_DEVELOPMENT = 'development'
export const ENV_PRODUCTION = 'production'

// Supported image types
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
]

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024
