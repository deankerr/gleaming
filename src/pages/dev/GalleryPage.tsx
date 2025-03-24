import type { FC } from 'hono/jsx'
import type { FileMetadata } from '../../db/schema'
import { ImageGallery } from './ImageGallery'
import { Layout } from './Layout'

export interface GalleryPageProps {
  images: FileMetadata[]
}

export const GalleryPage: FC<GalleryPageProps> = async ({ images }) => {
  return (
    <Layout
      title="Image Gallery"
      description="A gallery of uploaded images with thumbnails (dev only)"
      count={images.length}
      currentPath="/dev/gallery"
    >
      <ImageGallery images={images} />
    </Layout>
  )
}
