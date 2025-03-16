import { createRouter } from '../routers'
import { createImageRepository, type Image } from './image.repository'

const DEFAULT_USER_ID = 'default-user'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const imageRouter = createRouter()

type UploadParams = {
  file: File
  workspaceId: string
}

async function extractImageMetadata(
  env: CloudflareBindings,
  file: File,
): Promise<{
  format: string
  fileSize?: number
  width?: number
  height?: number
} | null> {
  try {
    return await env.IMAGES.info(file.stream())
  } catch (err) {
    console.error(err)
    return null
  }
}

function createImageEntity({
  mimeType,
  fileSize,
  workspaceId,
  userId,
  width,
  height,
}: {
  workspaceId: string
  userId: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
}): Image {
  const timestamp = new Date()
  const random = Math.random().toString(36).slice(2, 5)
  const storageKey = `${timestamp.getTime().toString(36)}${random}`

  return {
    uuid: crypto.randomUUID(),
    storageKey,
    mimeType,
    fileSize,
    width,
    height,
    userId,
    workspaceId,
    createdAt: timestamp.toISOString(),
  }
}

// upload image
imageRouter.post('/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File
  const workspaceId = formData.get('workspaceId') as string
  const userId = DEFAULT_USER_ID

  if (!workspaceId) {
    return c.json({ error: 'Missing workspaceId' }, 400)
  }

  // Validation
  if (!file) {
    return c.json({ error: 'Missing file' }, 400)
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` }, 400)
  }

  const metadata = await extractImageMetadata(c.env, file)
  if (!metadata) {
    return c.json({ error: 'Invalid image file' }, 400)
  }

  const imageEntity = createImageEntity({
    mimeType: metadata.format,
    fileSize: file.size,
    workspaceId,
    userId,
    width: metadata.width,
    height: metadata.height,
  })

  const imageRepo = createImageRepository(c.env)
  await imageRepo.store(imageEntity, file)

  return c.json({
    storageKey: imageEntity.storageKey,
  })
})

// serve image
imageRouter.get('/image/:storageKey', async (c) => {
  const { storageKey } = c.req.param()
  if (!storageKey) {
    return c.json({ error: 'Missing storageKey' }, 400)
  }

  const imageRepo = createImageRepository(c.env)
  const obj = await imageRepo.get(storageKey)
  if (!obj) {
    return c.json({ error: 'Image not found' }, 404)
  }

  return new Response(obj.object.body, {
    headers: {
      'Content-Type': obj.image.mimeType,
      'Cache-Control': 'public, max-age=31536000',
    },
  })
})

// list images
imageRouter.get('/images/:userId/:workspaceId?', async (c) => {
  const { userId, workspaceId } = c.req.param()
  const { cursor } = c.req.query()

  const imageRepo = createImageRepository(c.env)
  const {
    images,
    prefixes,
    cursor: nextCursor,
  } = await imageRepo.list({
    userId,
    workspaceId,
    cursor,
  })

  return c.json({
    images,
    prefixes,
    nextCursor,
  })
})

export default imageRouter

/**
 * R2 Object Types
 *
 * R2Object (metadata only):
 * - key: string - The object's key
 * - version: string - Random unique string for specific upload
 * - size: number - Size in bytes
 * - etag: string - Upload etag
 * - httpEtag: string - Quoted etag for HTTP headers
 * - uploaded: Date - Upload timestamp
 * - httpMetadata: {
 *     contentType?: string
 *     contentLanguage?: string
 *     contentDisposition?: string
 *     contentEncoding?: string
 *     cacheControl?: string
 *     cacheExpiry?: Date
 *   }
 * - customMetadata: Record<string, string> - User defined metadata
 * - checksums: {
 *     md5?: ArrayBuffer
 *     sha1?: ArrayBuffer
 *     sha256?: ArrayBuffer
 *     sha384?: ArrayBuffer
 *     sha512?: ArrayBuffer
 *   }
 * - writeHttpMetadata(headers: Headers): void
 * - storageClass: 'Standard' | 'InfrequentAccess'
 *
 * R2ObjectBody (extends R2Object):
 * - body: ReadableStream - The object's data stream
 * - bodyUsed: boolean - Whether the body has been read
 * - arrayBuffer(): Promise<ArrayBuffer>
 * - text(): Promise<string>
 * - json<T>(): Promise<T>
 * - blob(): Promise<Blob>
 */
