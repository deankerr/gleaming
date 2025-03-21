import type { GetImageBySlugRoute } from '../../routes/api'
import type { AppRouteHandler } from '../../types'
import { AppError, notFound } from '../../utils/errors'

/**
 * Handler for getting an image by its slug
 */
export const getImageInfoBySlug: AppRouteHandler<GetImageBySlugRoute> = async (c) => {
  const { slug } = c.req.valid('param')
  const db = c.get('db')

  try {
    // Find file record with this slug
    const file = await db.getFileBySlug(slug)

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
