import type { UploadImageRoute } from '../../routes/api'
import type { AppRouteHandler } from '../../types'
import { bytesToHex } from '@noble/hashes/utils'
import { ulid } from 'ulidx'
import { AppError, badRequest } from '../../utils/errors'
import { generateExternalId } from '../../utils/id'

/**
 * Handler for uploading an image directly from the client
 */
export const uploadImage: AppRouteHandler<UploadImageRoute> = async (c) => {
  const formData = c.req.valid('form')
  console.log('upload:', { formData })

  const userId = c.get('userId')
  const projectId = formData.projectId || c.get('projectId')

  const storageService = c.get('storage')
  const db = c.get('db')

  try {
    if (!formData.file) {
      throw badRequest('No file provided')
    }

    // TODO: validate content type
    const contentType = formData.file.type || 'application/octet-stream'
    console.log('contentType', contentType)

    // Generate a unique ID for both storage and database
    const objectId = ulid()
    const externalId = generateExternalId()
    const filename = formData.filename || formData.file.name || externalId

    const keyParts = {
      userId,
      projectId,
      objectId,
    }

    const httpMetadata: R2HTTPMetadata = {
      contentType,
    }

    const r2Object = await storageService.storeFile(keyParts, formData.file, { httpMetadata })
    const md5 = r2Object.checksums.md5
    if (!md5) {
      throw badRequest('Failed to store file properly')
    }

    const fileRecord = await db.createFile({
      objectId,
      externalId,
      size: r2Object.size,
      contentHash: bytesToHex(new Uint8Array(md5)),
      contentType,
      filename,
      metadata: {},
      userId,
      projectId,
    })

    return c.json(fileRecord, 201)
  }
  catch (error) {
    console.error('Error uploading file:', error)

    // Handle AppError instances
    if (error instanceof AppError) {
      const status = error.status === 404 || error.status === 415 ? 400 : error.status
      return c.json({ error: error.message, status }, status)
    }

    // Default to 500 for server errors
    return c.json({ error: 'Failed to process file upload', status: 500 }, 500)
  }
}
