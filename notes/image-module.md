# Image Module Reorganization Plan

## Current Issues

- The "public routes" distinction doesn't make sense as all routes are public
- Major data flows are unclear and not well-defined
- Handler/service/query functions have blurred responsibilities
- Database and storage operations are mixed together without clear separation

## Reorganization Strategy

### 1. Clear Separation of Concerns

Following the domain-based structure, we'll reorganize the image module with clear layers:

1. **Handlers Layer** (`image-handlers.ts`): HTTP request/response handling only
2. **Service Layer** (`image-service.ts`): Business logic and orchestration
3. **Data Access Layer**:
   - `image-repository.ts`: Database operations (extracted from image-queries.ts)
   - `image-storage.ts`: Storage operations (extracted from parts of image-service.ts)
4. **Domain Layer**:
   - `image-transformations.ts`: Image transformation logic
   - `image-entities.ts`: Domain entities and types
5. **Utils Layer** (`image-utils.ts`): Utility functions

### 2. Clarify Data Flows

We'll define clear data flows for the main operations:

- **Image Upload Flow**: Client → Handler → Service → Storage + Repository
- **Image Retrieval Flow**: Client → Handler → Service → Storage/Repository → Transformations (optional)
- **Image Transformation Flow**: Client → Handler → Service → Storage → Transformations → Client
- **Image Management Flow**: Client → Handler → Service → Repository

### 3. Simplify Public API

We'll consolidate the module's public API in index.ts, making it clear what's available to other modules.

## Implementation Plan

1. Create `image-entities.ts` for domain types and interfaces
2. Create `image-repository.ts` for database operations
3. Create `image-storage.ts` for storage operations
4. Refactor `image-handlers.ts` to focus only on HTTP concerns
5. Refactor `image-service.ts` to orchestrate operations
6. Update `image-transformations.ts` and `image-utils.ts` as needed
7. Update `index.ts` to export a clean, well-defined API

## File Responsibilities

### `image-entities.ts`

- Domain types and interfaces
- Type conversions between layers

### `image-repository.ts`

- Database operations (CRUD)
- Query building and execution
- Data mapping to/from domain entities

### `image-storage.ts`

- Storage operations (upload, download, delete)
- Storage key management
- Metadata handling for storage objects

### `image-handlers.ts`

- HTTP request parsing
- Response formatting
- Error handling
- Route-specific middleware

### `image-service.ts`

- Business logic orchestration
- Coordination between repository and storage
- Domain validations and rules

### `image-transformations.ts`

- Image transformation logic
- Format conversion
- Resizing and optimization

### `image-utils.ts`

- Utility functions
- Helper methods
- Common operations

### `index.ts`

- Route definitions
- Public API exports
- Module configuration
