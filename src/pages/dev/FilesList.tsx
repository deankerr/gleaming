import { FC } from 'hono/jsx'
import type { FileMetadata } from '../../db/schema'
import { formatFileSize, formatDateRelative } from './utils'

export interface FilesListProps {
  files: FileMetadata[]
}

export const FilesList: FC<FilesListProps> = ({ files }) => {
  return (
    <>
      <style>{`
        .files-table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .files-table th, .files-table td {
          padding: 12px 16px;
          text-align: left;
        }
        .files-table th {
          background-color: #f5f5f7;
          font-weight: 500;
          color: #555;
          font-size: 14px;
        }
        .files-table tr:not(:last-child) td {
          border-bottom: 1px solid #eee;
        }
        .files-table tr:hover td {
          background-color: #f9f9fb;
        }
        .slug-cell {
          font-weight: 500;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .content-type-cell {
          color: #888;
          font-size: 14px;
        }
        .size-cell {
          font-size: 14px;
          text-align: right;
        }
        .date-cell {
          font-size: 14px;
          color: #666;
          white-space: nowrap;
        }
        .action-cell {
          text-align: right;
          white-space: nowrap;
        }
        .btn {
          display: inline-block;
          padding: 6px 12px;
          background-color: #f2f2f2;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          color: #333;
          text-decoration: none;
          transition: background-color 0.2s;
          margin-left: 8px;
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

      {files.length === 0 ? (
        <div class="empty-state">
          <p>No files have been uploaded yet</p>
          <p>
            Use the API to upload files at <code>/upload</code> or <code>/ingest</code>
          </p>
        </div>
      ) : (
        <table class="files-table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Content Type</th>
              <th>Size</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              // Normalize content type
              const contentType = file.contentType.includes('/')
                ? file.contentType
                : `image/${file.contentType}`

              return (
                <tr>
                  <td class="slug-cell">{file.filename}</td>
                  <td class="content-type-cell">{contentType}</td>
                  <td class="size-cell">{formatFileSize(file.size)}</td>
                  <td class="date-cell">{formatDateRelative(file.createdAt)}</td>
                  <td class="action-cell">
                    <a href={`/file/${file.externalId}`} target="_blank" class="btn btn-primary">
                      View
                    </a>
                    <a href={`/api/info/${file.externalId}`} target="_blank" class="btn">
                      Info
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}
