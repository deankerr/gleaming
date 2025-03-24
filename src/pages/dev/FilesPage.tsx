import type { FC } from 'hono/jsx'
import type { FileMetadata } from '../../db/schema'
import { FilesList } from './FilesList'
import { Layout } from './Layout'

export interface FilesPageProps {
  files: FileMetadata[]
}

export const FilesPage: FC<FilesPageProps> = async ({ files }) => {
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
