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
