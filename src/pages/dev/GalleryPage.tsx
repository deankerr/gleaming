import { FC } from 'hono/jsx'
import { ImageGallery } from './ImageGallery'
import { Layout } from './Layout'
import type { FileMetadata } from '../../db/schema'

export interface GalleryPageProps {
  images: FileMetadata[]
}

export const GalleryPage: FC<GalleryPageProps> = ({ images }) => {
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
