import { DEFAULT_USER_ID, DEFAULT_WORKSPACE_ID } from '../../constants'
import type { UploadImageRoute } from '../../routes/files'
import type { AppRouteHandler } from '../../types'
import { AppError, badRequest } from '../../utils/errors'
import { cloneStream, generateHashFromStream } from '../../utils/hash'
import { generateCompactTimeId } from '../../utils/id'

/**
 * Handler for uploading an image
 */
export const uploadImage: AppRouteHandler<UploadImageRoute> = async (c) => {
  const { url, file, slug } = c.req.valid('form')

  const userId = DEFAULT_USER_ID
  const workspaceId = DEFAULT_WORKSPACE_ID

  // Get services from context
  const storageService = c.get('storage')
  const imageService = c.get('image')
  const db = c.get('db')

  try {
    let imageStream: ReadableStream<Uint8Array>
    let contentType: string

    // Get the image data from either url or direct upload
    if (file) {
      contentType = file.type
      imageStream = file.stream()
    } else if (url) {
      // Fetch the image from the URL
      throw badRequest('Not implemented') // NOTE: We will implement this later

      // const response = await fetch(url)

      // if (!response.ok) {
      //   throw badRequest(`Failed to fetch image from URL: ${response.statusText}`)
      // }

      // contentType = response.headers.get('content-type') || 'application/octet-stream'
      // imageStream = response.body as ReadableStream<Uint8Array>
    } else {
      throw badRequest('Either file or URL must be provided')
    }

    // Clone the stream so we can use it multiple times
    const [validationStream, processStream] = cloneStream(imageStream)

    // Validate the image
    const metadata = await imageService.validateImage(validationStream, contentType)

    // Clone the process stream for hashing and storage
    const [hashStream, storeStream] = cloneStream(processStream)

    // Generate a content-based hash
    const contentHash = await generateHashFromStream(hashStream)

    // Check if file already exists
    const existingFile = await storageService.fileExists(contentHash)

    // If file doesn't exist, store it
    if (!existingFile) {
      await storageService.storeFile(contentHash, storeStream, contentType)
    }

    // Create slug - use time ID as base, add user-provided slug only if provided
    const timeId = generateCompactTimeId()
    const fileSlug = slug ? `${timeId}-${slug}` : timeId

    // Create database record
    const fileRecord = await db.createFile({
      contentHash,
      contentType,
      size: metadata.fileSize || 0,
      metadata,
      slug: fileSlug,
      userId,
      workspaceId,
    })

    // Return the created file
    return c.json(fileRecord, 201)
  } catch (error) {
    console.error('Error uploading image:', error)

    // Handle AppError instances
    if (error instanceof AppError) {
      return c.json({ error: error.message, status: error.status }, error.status as 400) // TODO fix
    }

    // Default to 500 for server errors
    return c.json({ error: 'Failed to process image upload', status: 500 }, 500)
  }
}
