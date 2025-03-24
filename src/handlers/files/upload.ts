import { ulid } from 'ulidx'
import { DEFAULT_USER_ID, DEFAULT_WORKSPACE_ID } from '../../constants'
import type { UploadImageRoute } from '../../routes/api'
import type { AppRouteHandler } from '../../types'
import { AppError, badRequest } from '../../utils/errors'
import { generateExternalId } from '../../utils/id'
import { bytesToHex } from '@noble/hashes/utils'

/**
 * Handler for uploading an image directly from the client
 */
export const uploadImage: AppRouteHandler<UploadImageRoute> = async (c) => {
  const { file, filename: filenameParam } = c.req.valid('form')
  console.log('upload:', { file, filenameParam })

  const userId = DEFAULT_USER_ID
  const projectId = DEFAULT_WORKSPACE_ID

  const storageService = c.get('storage')
  const db = c.get('db')

  try {
    if (!file) {
      throw badRequest('No file provided')
    }

    // TODO: validate content type
    const contentType = file.type || 'application/octet-stream'
    console.log('contentType', contentType)

    // Generate a unique ID for both storage and database
    const objectId = ulid()
    const externalId = generateExternalId()
    const filename = filenameParam || (file as File)?.name || externalId

    const r2Object = await storageService.storeFile(objectId, file, contentType)
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
