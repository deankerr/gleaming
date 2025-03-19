import { DEFAULT_USER_ID, DEFAULT_WORKSPACE_ID } from '../../constants'
import type { UploadImageRoute } from '../../routes/files'
import type { AppRouteHandler } from '../../types'
import { AppError } from '../../utils/errors'
import { cloneStream, generateHashFromStream } from '../../utils/hash'
import { generateCompactTimeId } from '../../utils/id'

/**
 * Handler for uploading an image
 */
export const uploadImage: AppRouteHandler<UploadImageRoute> = async (c) => {
  const { file, slug } = c.req.valid('form')

  const userId = DEFAULT_USER_ID
  const workspaceId = DEFAULT_WORKSPACE_ID

  // Get services from context
  const storageService = c.get('storage')
  const imageService = c.get('image')
  const db = c.get('db')

  try {
    let imageStream: ReadableStream<Uint8Array>
    let contentType: string

    contentType = file.type
    imageStream = file.stream()

    // Clone the stream so we can use it multiple times
    const [validationStream, processStream] = cloneStream(imageStream)

    // Validate the image
    // This will validate both format and size
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
      size: metadata.fileSize, // Use the validated file size
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
