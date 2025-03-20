//@ts-nocheck

export interface Image {
  uuid: string // UUID
  storageKey: string // R2 key

  mimeType: string
  fileSize: number
  width?: number
  height?: number
  sourceUrl?: string

  userId: string // user entity (planned)
  workspaceId: string // workspace entity (planned)

  createdAt: string // ISO date string
}

type ImageCustomMetadata = { [P in keyof Image]: string }

function serializeImageMetadata(image: Image) {
  return Object.fromEntries(Object.entries(image).map(([key, value]) => [key, String(value ?? '')]))
}

function deserializeImageMetadata(metadata: ImageCustomMetadata): Image {
  return {
    ...metadata,
    fileSize: Number(metadata.fileSize),
    width: metadata.width ? Number(metadata.width) : undefined,
    height: metadata.height ? Number(metadata.height) : undefined,
  }
}

export function createImageRepository(env: Cloudflare) {
  return {
    store: async (image: Image, fileStream: File) => {
      const { storageKey, userId, workspaceId } = image
      const customMetadata = serializeImageMetadata(image)

      await Promise.all([
        env.BUCKET.put(`images/key/${storageKey}`, fileStream, {
          customMetadata,
        }),
        env.BUCKET.put(`images/user/${userId}/${workspaceId}/${storageKey}`, fileStream, {
          customMetadata,
        }),
      ])
    },

    get: async (storageKey: string) => {
      const object = await env.BUCKET.get(`images/key/${storageKey}`)

      if (!object?.customMetadata) {
        return null
      }

      const image = deserializeImageMetadata(object.customMetadata as ImageCustomMetadata)

      return { image, object }
    },

    list: async ({
      userId,
      workspaceId,
      cursor,
    }: {
      userId: string
      workspaceId?: string
      cursor?: string
    }) => {
      let prefix = `images/user/${userId}/`
      if (workspaceId) {
        prefix += `${workspaceId}/`
      }

      const listed = await env.BUCKET.list({
        prefix,
        cursor,
        limit: 50,
        include: ['customMetadata'],
      })

      return {
        images: listed.objects.map((obj) =>
          deserializeImageMetadata(obj.customMetadata as ImageCustomMetadata),
        ),
        prefixes: listed.delimitedPrefixes || [],
        cursor: listed.truncated ? listed.cursor : null,
      }
    },
  }
}
