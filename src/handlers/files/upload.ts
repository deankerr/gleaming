import { ulid } from 'ulidx'
import { DEFAULT_USER_ID, DEFAULT_WORKSPACE_ID } from '../../constants'
import type { UploadImageRoute } from '../../routes/api'
import type { AppRouteHandler } from '../../types'
import { AppError, badRequest } from '../../utils/errors'
import { generateFileSlug } from '../../utils/id'
import { bytesToHex } from '@noble/hashes/utils'

/**
 * Handler for uploading an image directly from the client
 */
export const uploadImage: AppRouteHandler<UploadImageRoute> = async (c) => {
  const { file, slug: suffix } = c.req.valid('form')
  console.log('upload:', { file, slug: suffix })

  const userId = DEFAULT_USER_ID
  const workspaceId = DEFAULT_WORKSPACE_ID

  // Get services from context
  const storageService = c.get('storage')
  const db = c.get('db')

  try {
    if (!file) {
      throw badRequest('No file provided')
    }

    // Trust the provided content type or use a fallback
    const contentType = file.type || 'application/octet-stream'
    console.log('contentType', contentType)

    // Generate a unique ID for both storage and database
    const id = ulid()

    // Store file directly in R2 using the ID as the key and passing the content type
    const r2Object = await storageService.storeFile(id, file.stream(), contentType)

    // Extract metadata from the R2 response
    const md5 = r2Object.checksums.md5
    if (!md5) {
      throw badRequest('Failed to store file properly')
    }

    // Generate a user-friendly slug
    const slug = generateFileSlug(suffix)

    // Create database record with the same ID
    const fileRecord = await db.createFile({
      id,
      contentHash: bytesToHex(new Uint8Array(md5)), // Use MD5 from R2 for deduplication potential
      contentType,
      size: r2Object.size, // Use the actual size from R2
      metadata: {}, // We're not doing image validation, so no metadata yet
      slug,
      userId,
      workspaceId,
    })

    // Return the created file
    return c.json(fileRecord, 201)
  } catch (error) {
    console.error('Error uploading file:', error)

    // Handle AppError instances
    if (error instanceof AppError) {
      const status = error.status === 404 || error.status === 415 ? 400 : error.status
      return c.json({ error: error.message, status }, status as 400 | 500)
    }

    // Default to 500 for server errors
    return c.json({ error: 'Failed to process file upload', status: 500 }, 500)
  }
}
