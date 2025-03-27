import type { IngestImageRoute } from '../../routes/api'
import type { AppRouteHandler } from '../../types'
import { bytesToHex } from '@noble/hashes/utils'
import { VALID_IMAGE_TYPES } from '../../constants'
import { AppError, badRequest, internalError } from '../../utils/errors'
import { getNormalizedFilename } from '../../utils/filename'
import { generateExternalId, generateUniqueId } from '../../utils/id'

/**
 * Handler for ingesting an image via URL
 */
export const ingestImage: AppRouteHandler<IngestImageRoute> = async (c) => {
  // Extract payload from request body
  const jsonData = c.req.valid('json')

  const userId = c.get('userId')
  const projectId = jsonData.projectId || c.get('projectId')

  const db = c.get('db')
  const storageService = c.get('storage')
  const fetchService = c.get('fetch')

  try {
    // Fetch the actual image
    const response = await fetchService.fetch(jsonData.url)
    if (!response.ok) {
      throw badRequest(`Failed to fetch image from URL: ${response.statusText}`)
    }

    // Only accept allowed image content types
    const contentType = response.info.contentType
    if (!contentType || !VALID_IMAGE_TYPES.includes(contentType)) {
      throw badRequest(`Unsupported content type: ${contentType}`)
    }

    if (!response.body) {
      throw internalError('Response body is empty')
    }

    let fileContent: ArrayBuffer | ReadableStream = response.body

    // Check if content-length header is missing or if we're dealing with SVG
    // This ensures we have a known length for R2 storage
    if (!response.info.contentLength) {
      try {
        fileContent = await response.arrayBuffer()
      }
      catch (error) {
        console.error('Error converting response to ArrayBuffer:', error)
        throw internalError('Failed to process image data')
      }
    }

    // Generate a unique ID for both storage and database
    const objectId = generateUniqueId()
    const externalId = generateExternalId()

    // Get normalized filename considering all sources
    const filename = getNormalizedFilename({
      customFilename: jsonData.filename,
      response,
    })

    const keyParts = {
      userId,
      projectId,
      objectId,
    }

    const r2Object = await storageService.storeFile(keyParts, fileContent, { httpMetadata: response.info })
    const md5 = r2Object.checksums.md5
    if (!md5) {
      throw internalError('Failed to store file')
    }

    // Create database record with the same ID
    const fileRecord = await db.createFile({
      objectId,
      externalId,
      contentHash: bytesToHex(new Uint8Array(md5)),
      contentType,
      size: r2Object.size,
      filename,
      userId,
      projectId,
      ingestUrl: jsonData.url,
      ingestMetadata: {
        ...c.get('requestMetadata'),
        method: 'ingest',
      },
      properties: jsonData.properties,
      tags: jsonData.tags,
    })

    // Return the created file
    return c.json(fileRecord, 201)
  }
  catch (error) {
    console.error('Error ingesting image from URL:', error)

    // Handle AppError instances
    if (error instanceof AppError) {
      const status = error.status === 404 || error.status === 415 ? 400 : error.status
      return c.json({ error: error.message, status }, status)
    }

    // Default to 500 for server errors
    return c.json({ error: 'Failed to process image ingestion', status: 500 }, 500)
  }
}
