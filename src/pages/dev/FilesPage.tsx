import { FC } from 'hono/jsx'
import { FilesList } from './FilesList'
import { Layout } from './Layout'
import type { FileMetadata } from '../../db/schema'

export interface FilesPageProps {
  files: FileMetadata[]
}

export const FilesPage: FC<FilesPageProps> = ({ files }) => {
  return (
    <Layout
      title="Files List"
      description="A list of all uploaded files (dev only)"
      count={files.length}
      currentPath="/dev/files"
    >
      <FilesList files={files} />
    </Layout>
  )
}
