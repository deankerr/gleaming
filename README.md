# Gleaming: Image Hosting & Optimization Service

Gleaming is a specialized image hosting and optimization service built with Cloudflare technologies. It provides a robust, API-driven backend for image storage, retrieval, and dynamic transformations.

## System Architecture

Gleaming uses a Cloudflare-first approach with the following core components:

- **Cloudflare Workers**: Serverless functions that handle all API requests
- **Cloudflare R2**: Object storage for the actual image files
- **Cloudflare D1**: SQL database for storing image metadata
- **Cloudflare Images API**: Used for image metadata extraction and validation

## Key Features

- **Image Storage**: Secure, fast storage of original images
- **Dynamic Image Transformations**: On-the-fly image resizing and format conversion
- **Workspace Organization**: Logical grouping of images
- **Collections**: Sub-organization within workspaces
- **Metadata Management**: Store and retrieve information about images

## Getting Started

### Prerequisites

- Cloudflare account with Workers, R2, and D1 enabled
- Node.js and pnpm installed

### Setup

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Set up your Cloudflare bindings:

   - Create an R2 bucket named `gleaming-images`
   - Create a D1 database
   - Set up the Cloudflare Images binding

4. Configure your `wrangler.toml` with the appropriate bindings:

```toml
# Example wrangler.toml configuration
[[r2_buckets]]
binding = "gleaming-images"
bucket_name = "gleaming-images"

[[d1_databases]]
binding = "DB"
database_name = "gleaming"
database_id = "your-database-id"
```

5. Run the database migrations (if not already done)

6. Deploy to Cloudflare:

```bash
wrangler deploy
```

## API Endpoints

### Image Management

#### Upload an Image

```
POST /api/v1/images/upload
```

- Content-Type: multipart/form-data
- Form fields:
  - `file`: The image file to upload
  - `workspace_id`: (Optional) The workspace to associate the image with
  - `collection_id`: (Optional) The collection to associate the image with

#### List Images

```
GET /api/v1/images
```

- Query parameters:
  - `workspace`: (Optional) Filter by workspace ID (defaults to "default-workspace")
  - `collection`: (Optional) Filter by collection ID
  - `limit`: (Optional) Maximum number of results (default: 50)
  - `offset`: (Optional) Pagination offset

#### Get Image Metadata

```
GET /api/v1/images/:id
```

- Returns metadata about the image without the binary data

#### Delete Image

```
DELETE /api/v1/images/:id
```

- Removes both the image file and metadata

### Public Image Access

#### Get Original Image

```
GET /image/:id/:filename?
```

- Returns the original image file
- The filename is optional and can be any string
- If no filename is provided, the original image is returned

#### Get Transformed Image

```
GET /image/:id/:filename.ext?w=width&h=height&q=quality&fit=fitMode
```

- Returns a transformed version of the image
- Format: `/image/:id/:filename.ext?w=width&h=height&q=quality&fit=fitMode`
- Examples:
  - `/image/abc123/my-image.webp?w=800` - 800px wide WebP
  - `/image/abc123/my-image.jpeg?w=400&h=300&q=90` - 400x300px JPEG at 90% quality
  - `/image/abc123/my-image.webp` - Original dimensions in WebP format

## Code Organization

- **`/cf-images/src`**: Core source code
  - **`/database.ts`**: D1 database operations
  - **`/image-service.ts`**: Core image handling logic
  - **`/utils.ts`**: Helper functions
  - **`/types.ts`**: TypeScript type definitions
  - **`/routes`**: API route handlers
    - **`/admin.ts`**: Admin panel routes
    - **`/images.ts`**: Image API routes
    - **`/public.ts`**: Public image access routes

## Development Workflow

1. Make changes to the code
2. Test locally:

```bash
wrangler dev
```

3. Deploy changes:

```bash
wrangler deploy
```

## Image Transformation

Gleaming supports dynamic image transformations via URL parameters:

- **Width**: Use `w` or `width` parameter to specify width in pixels
- **Height**: Use `h` or `height` parameter to specify height in pixels
- **Format**: File extension determines output format (e.g., `.webp`, `.jpeg`, `.png`)
- **Quality**: Use `q` or `quality` parameter to set JPEG/WebP quality (1-100)
- **Fit**: Use `fit` parameter to control resizing behavior:
  - `cover` (default): Fill the dimensions, cropping if needed
  - `contain`: Maintain aspect ratio, fit within dimensions
  - `fill`: Stretch/squash to match dimensions exactly
  - `scale-down`: Only resize if image is larger than dimensions

Example transformations:

```
/image/abc123/my-image.webp?w=800             # 800px wide WebP image
/image/abc123/my-image.jpeg?w=400&h=300&q=90  # 400x300px JPEG at 90% quality
/image/abc123/my-image.webp?w=800&fit=contain # 800px wide WebP, maintain aspect ratio
/image/abc123/my-image.webp                   # Original dimensions converted to WebP format
```

## Data Model

### Images

- `id`: Public-facing identifier
- `uuid`: Internal primary key
- `original_filename`: Original uploaded filename
- `cloudflare_id`: Reference to R2 storage object
- `mime_type`: Content type
- `size`: File size in bytes
- `width/height`: Image dimensions
- `workspace_id`: Workspace this image belongs to
- `collection_id`: Collection this image belongs to (optional)

### Workspaces

- `id`: Unique identifier
- `name`: Display name
- `description`: Optional description
- `user_id`: Owner's user ID

### Collections

- `id`: Unique identifier
- `name`: Display name
- `description`: Optional description
- `workspace_id`: Parent workspace
- `user_id`: Owner's user ID

## Notes

- The system currently uses a simplified authentication model with a default user
- Transformations are powered by Cloudflare's image resizing service
- Original images are always preserved
