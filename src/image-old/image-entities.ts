/**
 * Domain entities and types for the image module
 */

// Image domain entity
export interface Image {
  id: string
  filename: string
  contentType: string
  size: number
  width?: number
  height?: number
  uploadedAt: number
  workspaceId: string
  collectionId?: string
  sourceUrl?: string
}

// Storage-specific image metadata
export interface StorageImageMetadata {
  id: string
  key: string
  contentType: string
  size: number
  etag: string
  width?: number
  height?: number
  originalFilename: string
  customMetadata?: Record<string, string>
}

// Image transformation options
export interface ImageTransformOptions {
  width?: number
  height?: number
  fit?: 'cover' | 'scale-down' | 'contain' | 'crop' | 'pad'
  quality?: number
  format?: 'avif' | 'webp' | 'json' | 'jpeg' | 'png'
}

// Image upload parameters
export interface ImageUploadParams {
  file: File
  workspaceId: string
  collectionId?: string
  title?: string
  description?: string
  tags?: string[]
  sourceUrl?: string
}

// Image retrieval parameters
export interface ImageRetrievalParams {
  id: string
  transformOptions?: ImageTransformOptions
  filename?: string
}

// Image list parameters
export interface ImageListParams {
  workspaceId: string
  collectionId?: string
  limit?: number
  offset?: number
  cursor?: string
  tags?: string[]
}

// Response types
export interface ImageResponse {
  success: boolean
  data?: Image
  error?: string
}

export interface ImageListResponse {
  success: boolean
  data?: {
    images: Image[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  error?: string
}

// Type conversion functions
export function mapDbImageToImage(dbImage: any): Image {
  return {
    id: dbImage.id,
    filename: dbImage.original_filename,
    contentType: dbImage.mime_type,
    size: dbImage.size,
    width: dbImage.width,
    height: dbImage.height,
    uploadedAt: dbImage.created_at,
    workspaceId: dbImage.workspace_id,
    collectionId: dbImage.collection_id,
    sourceUrl: dbImage.source_url,
  }
}

// Constants
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
