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

## Example Final Project Structure

Only create modules when they are needed!

```
/src
├── index.ts                 # Main entry point - binds everything together
├── routes/                  # API endpoints grouped by domain
│   ├── files.ts             # File-related routes (/files/*)
│   ├── users.ts             # User path routes (/users/*)
│   ├── workspaces.ts        # Workspace management
│   └── admin.ts             # Admin-only routes
├── handlers/                # Core business logic implementing route handlers
│   ├── files/
│   │   ├── index.ts         # Re-exports from this directory
│   │   ├── upload.ts        # File upload logic
│   │   ├── serve.ts         # File serving logic
│   │   └── manage.ts        # File management (rename, delete, etc.)
│   └── workspaces/
│       └── ...
├── content-types/           # Content handler registry & implementations
│   ├── index.ts             # Registry and interface definitions
│   ├── image.ts             # Image handler (jpg, png, etc.)
│   ├── svg.ts               # SVG-specific handler
│   ├── markdown.ts          # Markdown handler with HTML rendering
│   └── default.ts           # Default handler for unsupported types
├── renderers/               # Output rendering implementations
│   ├── index.ts             # Registry of renderers
│   ├── raw.ts               # Raw content delivery
│   ├── html.ts              # HTML wrapper for content types that support it
│   └── transform.ts         # Image transformations (resize, etc.)
├── storage/                 # Storage layer abstraction
│   ├── index.ts             # Storage interface
│   ├── r2.ts                # R2 implementation
│   └── content-addressed.ts # Content addressing helpers
├── database/                # Database operations
│   ├── schema.ts            # Schema definitions
│   ├── migrations/          # Database migrations
│   └── repositories/        # Data access repositories
│       ├── files.ts         # File data operations
│       ├── workspaces.ts    # Workspace data operations
│       └── users.ts         # User data operations
├── utils/                   # Shared utilities
│   ├── id.ts                # ID generation (ULIDs, etc.)
│   ├── hash.ts              # Content hashing utilities
│   └── errors.ts            # Error definitions
└── types/                   # Type definitions
    ├── index.ts             # Re-exports all types
    ├── file.ts              # File-related types
    ├── metadata.ts          # Metadata types for different content types
    └── env.ts               # Environment bindings type definitions
```
