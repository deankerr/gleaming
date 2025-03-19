import type { GetImageByHashRoute } from '../../routes/files'
import type { AppRouteHandler } from '../../types'
import { AppError, notFound } from '../../utils/errors'

/**
 * Handler for getting an image by its content hash
 */
export const getImageByHash: AppRouteHandler<GetImageByHashRoute> = async (c) => {
  const { hash } = c.req.valid('param')
  const db = c.get('db')
  const storageService = c.get('storage')

  try {
    // Find file records with this hash using the direct method
    const file = await db.getFileByContentHash(hash)

    if (!file) {
      throw notFound('File')
    }

    // Return the file metadata
    return c.json(file, 200)
  } catch (error) {
    console.error('Error retrieving image:', error)

    if (error instanceof AppError) {
      return c.json(
        {
          error: error.message,
          status: error.status,
        },
        404,
      )
    }

    // Default to 500 for server errors
    return c.json({ error: 'Failed to retrieve image', status: 500 }, 500)
  }
}
