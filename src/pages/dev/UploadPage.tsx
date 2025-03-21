import { FC } from 'hono/jsx'
import { Layout } from './Layout'
import { UploadForm } from './UploadForm'

interface UploadPageProps {
  currentPath: string
}

export const UploadPage: FC<UploadPageProps> = ({ currentPath }) => {
  return (
    <Layout title="Upload Images" description="Upload images via file or URL" currentPath={currentPath}>
      <UploadForm />
    </Layout>
  )
}
