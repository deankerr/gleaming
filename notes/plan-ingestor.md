# Ingestor Improvements: Origin Tracking & Rate Limiting

## Problem Statement

Currently, our image ingestion system does not maintain any information about where files come from or track usage patterns. This creates several challenges:

1. We may unnecessarily re-fetch the same resource multiple times
2. We risk overwhelming external servers by not limiting our request rates
3. We cannot trace the origin or context of ingested files
4. We lack data for analyzing usage patterns or troubleshooting issues

## Goals

1. **Origin Tracking**
   - Record the source of every file (upload or URL)
   - Store relevant metadata about the ingestion process
   - Enable querying files by their origin
   - Maintain an audit trail of ingestion attempts

2. **Rate Limiting**
   - Prevent excessive requests to the same domain

3. **Context Preservation**
   - Capture request context (user agent, IP, etc.)
   - Store response metadata (headers, size, etc.)
   - Track success/failure metrics
   - Enable historical analysis

## Proposed Solution Outline 1

### Storage Strategy

1. **Permanent Storage (SQLite)**
   - New table for origin records
   - Links to main files table
   - Stores comprehensive metadata
   - Enables complex queries

### Key Components

1. **Origin Tracking System**
   - Record keeping for all ingestion attempts
   - Source classification (upload vs URL)
   - Metadata collection
   - Audit trail maintenance

2. **Rate Limiting System**
   - Domain-based request tracking
   - Automatic expiration

3. **Query Interface**
   - Search by domain/path
   - Filter by time period
   - Access attempt history
   - Usage statistics

### Fetch Service Design

The current fetch logic should be extracted into a dedicated service to:
1. Centralize fetch operations and security policies
2. Integrate rate limiting and origin tracking
3. Provide a reusable interface for other services

#### Service Responsibilities
- URL validation and security checks
- Rate limit enforcement using KV
- Response validation and metadata collection
- Retry logic and error handling
- Metrics collection

#### Key Features
1. **Security**
   - URL validation and sanitization
   - Protocol restrictions
   - Domain blocklist management
   - Private network protection

2. **Rate Limiting**
   - Cloudflare Rate Limiting (Beta)

3. **Metadata Collection**
   - Response headers
   - Timing metrics
   - Size tracking
   - Error logging

4. **Configuration**
   - Customizable timeouts
   - Blocklist updates
   - Retry policies

#### Integration Points
2. **With Origin Tracking**
   - Automatic metadata collection
   - Success/failure logging
   - Request context preservation

3. **With Main Application**
   - Clean async interface
   - Error propagation
   - Configuration injection
   - Metrics exposure

This service would be the foundation for reliable and controlled external resource fetching across the application.
