# Gleaming: Image Hosting & Optimization Service

## Core Purpose

- Specialized image hosting and optimization service with AI-powered features
- Backend component that can be integrated with existing services
- Modular architecture allowing for component customization
- **Primarily API-driven service with minimal direct UI**

## Primary Features

- **Image Hosting & Optimization**

  - Edge CDN hosting for fast global delivery
  - Automatic optimization to standard dimensions/formats
  - Dynamic image transformations (compatible with Next.js Image)
  - Original image preservation with optimized derivatives

- **AI Integration**

  - Automated image captioning
  - Semantic search capabilities
  - Image analysis for LLM preprocessing

- **Organization System**

  - Workspace/project silos for content organization
  - Collections within workspaces (for website users, IRC channels, etc.)
  - Flexible metadata management

- **API-First Design**

  - REST API with JSON interface for all core functionality
  - Ingestion API (direct upload and URL retrieval)
  - Query/management API for metadata and organization
  - Simple workflow system for image processing
  - Comprehensive API documentation and client libraries

- **Access Control**
  - Open read access via opaque URLs (initially)
  - Secured write access via API keys
  - Siloed content management

## Use Cases

1. **AI Website Integration**

   - Backend for existing generative AI service
   - Transparent image handling for website users

2. **IRC Bot Integration**

   - Process and store images shared in channels
   - Handle URL links posted in channels

3. **LLM Chat Preprocessing**

   - Validate image links before sending to inference endpoints
   - Optimize images for specific LLM requirements
   - Generate captions to avoid redundant image processing

4. **Personal Use**
   - Screenshot management and optimization
   - Personal image library with search capabilities

## Near-Term Extensions

- Basic fal.ai image generation integration
- Admin/management interface (developer-focused)
- Enhanced access controls (private links, time restrictions)
- Automatic cleanup of optimized derivatives
- Basic image/collection pages

## Future Goals

- Advanced search interface
- User-friendly web interface
- User account system with invite-only access

## Technical Approach

- Modular, service-oriented architecture
- REST/JSON API standards for all service interfaces
- S3-compatible storage backend
- Vector database for semantic features
- Swappable components for flexibility
