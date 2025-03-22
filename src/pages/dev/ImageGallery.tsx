import { FC } from 'hono/jsx'
import type { FileMetadata } from '../../db/schema'
import { formatFileSize, formatDateRelative } from './utils'

export interface ImageGalleryProps {
  images: FileMetadata[]
}

export const ImageGallery: FC<ImageGalleryProps> = ({ images }) => {
  return (
    <>
      <style>{`
        .gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        .image-card {
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .image-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
        }
        .thumbnail {
          display: block;
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
        .thumbnail-container {
          position: relative;
          overflow: hidden;
        }
        .image-type-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 3px 6px;
          font-size: 11px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .image-info {
          padding: 16px;
          font-size: 14px;
        }
        .image-slug {
          font-weight: 500;
          margin: 0 0 6px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .image-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 12px;
          color: #666;
        }
        .content-type {
          color: #888;
          font-size: 12px;
        }
        .dimension-info {
          margin-top: 4px;
          font-size: 12px;
          color: #888;
        }
        .btn-group {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .btn {
          padding: 6px 12px;
          background-color: #f2f2f2;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          color: #333;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #e5e5e5;
        }
        .btn-primary {
          background-color: #0066cc;
          color: white;
        }
        .btn-primary:hover {
          background-color: #0055aa;
        }
        .empty-state {
          text-align: center;
          padding: 40px;
          background-color: white;
          border-radius: 12px;
          color: #666;
        }
      `}</style>

      {images.length === 0 ? (
        <div class="empty-state">
          <p>No images have been uploaded yet</p>
          <p>
            Use the API to upload images at <code>/upload</code> or <code>/ingest</code>
          </p>
        </div>
      ) : (
        <div class="gallery">
          {images.map((file) => {
            // Extract format from content type (e.g., image/jpeg -> JPEG)
            const contentType = file.contentType.includes('/')
              ? file.contentType
              : `image/${file.contentType}`
            const format = contentType.split('/')[1]?.toUpperCase() || 'UNKNOWN'

            // Get dimensions from metadata if available
            const metadata = (file.metadata as Record<string, any>) || {}
            const width = metadata.width
            const height = metadata.height
            const hasDimensions = typeof width === 'number' && typeof height === 'number'

            return (
              <div class="image-card">
                <div class="thumbnail-container">
                  <a href={`/file/${file.externalId}`} target="_blank">
                    <img
                      src={`/file/${file.externalId}?width=500&height=400&fit=cover`}
                      alt={file.filename}
                      class="thumbnail"
                      loading="lazy"
                    />
                  </a>
                  <span class="image-type-badge">{format}</span>
                </div>
                <div class="image-info">
                  <p class="image-slug">{file.filename}</p>
                  <p class="content-type">{contentType}</p>
                  {hasDimensions && (
                    <p class="dimension-info">
                      {width}×{height} px
                    </p>
                  )}
                  <div class="image-meta">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDateRelative(file.createdAt)}</span>
                  </div>
                  <div class="btn-group">
                    <a href={`/file/${file.externalId}`} target="_blank" class="btn btn-primary">
                      Original
                    </a>
                    <a href={`/api/info/${file.externalId}`} target="_blank" class="btn">
                      Info
                    </a>
                    <a
                      href={`/file/${file.externalId}?width=200&height=200&fit=contain&format=webp`}
                      target="_blank"
                      class="btn"
                    >
                      WebP
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
