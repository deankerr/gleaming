import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { HTTPException } from 'hono/http-exception'
import { CloudflareBindings } from '../types'
import { getImage } from '../image-service'
import { getContentTypeFromFilename } from '../utils'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Redirect root to admin dashboard
app.get('/', (c) => {
  return c.redirect('/admin')
})

// Public image access with optional filename and format conversion
// Handles both:
// - /image/:id (original image)
// - /image/:id/:any_filename (original image)
// - /image/:id/:any_filename.ext (format conversion)
// - /image/:id/:any_filename.ext?w=800&h=600 (transformation)
app.get(
  '/image/:id/:filename?',
  cache({
    cacheName: 'gleaming-images',
    cacheControl: 'public, max-age=31536000', // Cache for 1 year
  }),
  async (c) => {
    const id = c.req.param('id')
    const filenameParam = c.req.param('filename')
    const url = new URL(c.req.url)

    try {
      // Get the original image
      const { object, key } = await getImage(c.env['gleaming-images'], c.env.DB, id)

      if (!object) {
        throw new HTTPException(404, { message: 'Image not found' })
      }

      // Determine original content type
      const originalContentType = object.httpMetadata?.contentType || getContentTypeFromFilename(key)

      // Extract the original filename from the key for Content-Disposition
      const originalFilename = key.split('/').pop() || id

      // Parse filename to extract extension if present
      let format: string | undefined
      let filename = filenameParam || id

      if (filenameParam) {
        const parts = filenameParam.split('.')
        if (parts.length > 1) {
          format = parts.pop()?.toLowerCase()
          filename = parts.join('.')
        }
      }

      // Check if we need to transform the image
      const width = parseInt(url.searchParams.get('w') || url.searchParams.get('width') || '0') || undefined
      const height = parseInt(url.searchParams.get('h') || url.searchParams.get('height') || '0') || undefined
      const quality = parseInt(url.searchParams.get('q') || url.searchParams.get('quality') || '80')
      const fit = url.searchParams.get('fit') || 'cover'

      // If no transformation needed, serve the original (possibly with format conversion)
      if (
        !width &&
        !height &&
        !format &&
        !url.searchParams.has('q') &&
        !url.searchParams.has('quality') &&
        !url.searchParams.has('fit')
      ) {
        // Access the data using the R2Object's methods
        const objectWithBody = object as any

        // Create a friendly filename for Content-Disposition
        const saveFilename = filenameParam || originalFilename

        // Serve the image with appropriate headers
        return new Response(objectWithBody.body, {
          headers: {
            'Content-Type': originalContentType,
            'Content-Disposition': `inline; filename="${saveFilename}"`,
            'Cache-Control': 'public, max-age=31536000',
            ETag: object.etag,
          },
        })
      }

      // Otherwise, we need to transform the image

      // Prepare transform options
      const transformOptions: any = {
        width,
        height,
        fit,
        quality,
      }

      // Set format if specified
      if (format) {
        transformOptions.format = format
      }

      // Remove undefined values
      Object.keys(transformOptions).forEach((key) => {
        if (transformOptions[key] === undefined) {
          delete transformOptions[key]
        }
      })

      // When running locally with wrangler, we need to use the public URL
      // In production, we can use the object body directly
      const baseUrl = new URL(c.req.url).origin
      const originalImageUrl = `${baseUrl}/image/${id}`

      console.log(`Transforming image using URL: ${originalImageUrl}`)

      // Transform the image using Cloudflare's image resizing service
      const response = await fetch(originalImageUrl, {
        cf: {
          image: transformOptions,
        },
      })

      // Check if transformation was successful
      if (!response.ok) {
        throw new HTTPException(500, {
          message: `Image transformation failed with HTTP ${response.status}: ${response.statusText}`,
        })
      }

      // Determine output content type
      const outputFormat = transformOptions.format || format || originalContentType.split('/').pop()
      const contentType = getContentTypeFromFilename(`image.${outputFormat}`)

      // Create a friendly filename for Content-Disposition that includes transformation info
      let saveFilename = filename || originalFilename.split('.')[0]
      if (width || height) {
        saveFilename += `-${width || 'auto'}x${height || 'auto'}`
      }
      saveFilename += `.${outputFormat}`

      // Clone the response with our cache headers
      return new Response(response.body, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${saveFilename}"`,
          'Cache-Control': 'public, max-age=86400', // Cache transformed images for 24 hours
          Vary: 'Accept',
        },
        status: response.status,
        statusText: response.statusText,
      })
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      console.error('Image error:', error)
      throw new HTTPException(500, { message: 'Failed to process image' })
    }
  },
)

export default app
