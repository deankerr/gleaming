// CloudflareBindings interface for environment variables and bindings
export interface CloudflareBindings {
  // R2 bucket binding
  'gleaming-images': R2Bucket

  // Cloudflare Images binding
  IMAGES: any

  // D1 database binding
  DB: D1Database

  // Environment variables can be added here
  ENVIRONMENT?: string
  CF_ACCOUNT_ID?: string
  CF_API_TOKEN?: string
  API_SECRET?: string
}

// Image metadata structure
export interface ImageMetadata {
  id: string // Unique identifier (public-facing ID)
  filename: string // Original filename
  contentType: string // MIME type
  size: number // File size in bytes
  width?: number // Image width
  height?: number // Image height
  uploadedAt: number // Timestamp of upload
  url: string // URL to access the image
  workspaceId?: string // Workspace ID
  collectionId?: string // Collection ID
}

// Database entity interfaces
export interface DbImage {
  uuid: string // Internal primary key
  id: string // Public-facing ID
  cloudflare_id: string // Reference to Cloudflare R2 object
  original_filename: string
  mime_type: string
  size: number
  width?: number
  height?: number
  workspace_id: string
  collection_id?: string
  source_url?: string
  user_id: string
  created_at: number
}

export interface DbCollection {
  id: string
  name: string
  description?: string
  workspace_id: string
  user_id: string
  created_at: number
}

export interface DbWorkspace {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: number
}

// Constants
import { DEFAULT_USER_ID, DEFAULT_WORKSPACE_ID } from './constants'
// Re-export for backward compatibility
export { DEFAULT_USER_ID, DEFAULT_WORKSPACE_ID }

// Image upload response
export interface ImageUploadResponse {
  success: boolean
  message?: string
  image?: ImageMetadata
  error?: string
}

// Image list response
export interface ImageListResponse {
  success: boolean
  images: ImageMetadata[]
  cursor?: string // For pagination
  count: number
}

// Error response
export interface ErrorResponse {
  success: false
  error: string
  status: number
}

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
