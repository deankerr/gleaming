# Image Ingestion Pipeline: Cloudflare-Only Approach

## Overall Goals

- Transition to a Cloudflare-only architecture using R2 for storage and D1 for metadata
- Implement a unified ingestion pipeline for uploads and URL retrievals
- Create a foundation for future expansion with AI processing capabilities
- Maintain workspaces and collections organization structure
- Keep compatibility with existing API endpoints

## Core Components

### 1. Database Structure

- D1 SQL database for metadata storage
- Separate internal UUID from public-facing ID
- Single-user approach initially with constant user ID in code
- Tables for images, collections, and workspaces

### 2. Storage Approach

- Cloudflare R2 for binary image storage
- Original image preservation
- Future preparation for image transformations

### 3. Ingestion Pipeline

- Unified processing flow for both upload and URL ingestion
- Validation and sanitization of inputs
- Metadata extraction from images
- Consistent ID generation and relationship management
- Transaction-based metadata storage

## Implementation Steps

### Phase 1: Core Infrastructure

- Set up D1 database with required schema
- Define TypeScript types for database entities
- Update bindings in Cloudflare Workers
- Implement database utility functions

### Phase 2: Upload Pipeline

- Update existing upload endpoint to work with D1
- Incorporate unique ID generation (UUID + public ID)
- Extract and store metadata from uploaded images
- Add workspace/collection association
- Implement proper error handling

### Phase 3: URL Ingestion

- Create endpoint for URL-based image ingestion
- Implement secure URL fetching with validation
- Process retrieved images through the same pipeline as uploads
- Handle edge cases (invalid URLs, large files, timeouts)

### Phase 4: Query and Management APIs

- List images by workspace/collection
- Image metadata retrieval
- Collection management
- Basic workspace operations

### Phase 5: Admin Interface Updates

- Update admin UI to work with new data model
- Display workspace/collection organization
- Implement basic management capabilities

## Future Extensions

- AI processing pipeline integration
- Image transformation capabilities
- Enhanced access controls
- Multi-user support
- Vector search capabilities
