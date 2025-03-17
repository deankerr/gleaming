# Gleaming - Content Storage & Optimization Service

## Philosophy & Approach

- API-first design with minimal direct UI
- Content-addressed storage for deduplication and integrity
- Fail fast error handling - terminate broken operations cleanly
- Start with images only, expand to other content types as needed
- Trust users but validate inputs
- Focus on personal/trusted use initially

## Core Architecture

### Storage Strategy

- Content stored once by hash in R2
- Metadata in D1 with Drizzle ORM
- Separate internal IDs from public access IDs
- Support both opaque URLs and human-readable paths
- Public access can be revoked by invalidating public IDs

### Database Schema

```typescript
// Core files table
const files = sqliteTable('files', {
  id: text('id').primaryKey(), // Internal ID
  workspaceId: text('workspace_id').notNull(),
  contentHash: text('content_hash').notNull(), // BLAKE-3
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  filename: text('filename'),

  // System-managed metadata specific to file type
  // e.g. for images: { width: 800, height: 600, format: 'jpeg' }
  // e.g. for markdown: { wordCount: 150, hasCodeBlocks: true }
  systemMetadata: text('system_metadata', { mode: 'json' }),

  // User-supplied metadata (tags, descriptions, etc)
  userMetadata: text('user_metadata', { mode: 'json' }),

  // Access control
  publicId: text('public_id'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),

  // Human-readable path components
  ownerUsername: text('owner_username').notNull(),
  slug: text('slug'),
})
```

### Metadata Strategy

The system uses two separate JSON fields for metadata:

1. **System Metadata** (`systemMetadata`)

   - Managed by content type handlers
   - Contains file type-specific technical metadata
   - Immutable after content processing
   - Examples:
     - Images: dimensions, format, color space
     - Documents: page count, word count
     - Audio: duration, bitrate, codec

2. **User Metadata** (`userMetadata`)
   - Flexible storage for user-supplied data
   - Can be updated independently
   - Examples:
     - Tags
     - Descriptions
     - Custom grouping
     - Application-specific metadata

This separation ensures:

- Clear ownership of metadata
- Independent validation rules
- No mixing of system and user concerns
- Type safety through content handler interfaces

### URL Structure

- Opaque URLs: `/files/<public_id>?w=600`
- Human-readable: `/users/<username>/[workspace]/custom-slug.ext`

### Error Handling

- Single `AppError` class for all application errors
- Global error handler in Hono
- Fail fast and bubble up errors
- Clean error messages for users without exposing internals
- Zod validation for request data

## Initial Feature Set (v1)

### Image Support

- Upload and storage
- Metadata extraction via Cloudflare Images
- Basic transformations (resize, format conversion)
- CDN delivery
- Workspace organization

### API Endpoints

- File upload
- Image serving (with transformations)
- Workspace management
- Basic admin/dev UI

## Future Extensions

### Additional Content Types

- Modular content type handler system
- Type-specific metadata extraction
- Custom renderers per type
- Example: Markdown with HTML preview

### Enhanced Features

- Advanced access controls
- Time-based access
- Download tracking
- Enhanced search capabilities

## Project Structure

```
src/
  ├── content-types/        # Content type handlers
  │   ├── image.ts
  │   └── index.ts         # Handler registry
  ├── routes/              # Hono routes
  │   ├── files.ts
  │   └── workspaces.ts
  ├── handlers/            # Business logic
  │   └── files/
  ├── db/                  # Drizzle schema & migrations
  ├── utils/
  │   └── errors.ts        # Error handling
  └── index.ts            # App entry point
```

## Development Guidelines

1. Keep changes focused and modular
2. Maintain type safety throughout
3. Write clear error messages
4. Document API changes
5. Consider future extensibility
6. Test thoroughly before adding new content types

## Tech Stack

- Cloudflare Workers
- R2 Storage
- D1 Database
- Drizzle ORM
- Hono Framework
- TypeScript
- Cloudflare Images for validation/optimization
