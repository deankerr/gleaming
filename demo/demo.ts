#!/usr/bin/env bun
/* eslint-disable no-console */
/* eslint-disable node/prefer-global/process */
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { parseArgs } from 'node:util'

// Configuration constants
const API_BASE_URL = 'http://localhost:8787'
const PATH_UPLOAD = '/api/upload'
const PATH_INGEST = '/api/ingest'
const PATH_INFO = '/api/info'
const PATH_SERVE = '/file'

// Get API token from environment variables
const ENV_API_TOKEN = process.env.API_TOKEN

// Command line arguments parsing
const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    url: {
      type: 'string',
      short: 'u',
      default: API_BASE_URL,
    },
    filename: {
      type: 'string',
      short: 'f',
    },
    token: {
      type: 'string',
      short: 't',
      default: ENV_API_TOKEN, // Use env var as default if available
    },
    noauth: {
      type: 'boolean',
      default: false,
    },
  },
  allowPositionals: true,
})

// Command handlers
const commands = {
  upload: uploadFile,
  ingest: ingestImageUrl,
  get: getFile,
  help: showHelp,
}

// Main function
async function main() {
  try {
    const [command, ...args] = positionals

    if (!command || !(command in commands)) {
      showHelp()
      process.exit(1)
    }

    await commands[command as keyof typeof commands](...args)
  }
  catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Show help message
function showHelp() {
  console.log(`
Usage: bun run demo.ts <command> [options]

Commands:
  upload <filename>            Upload a file from the demo directory
  ingest <url>                 Ingest an image from a URL 
  get <hash>                   Get a file by its content hash
  help                         Show this help message

Options:
  -u, --url <url>              API base URL (default: ${API_BASE_URL})
  -f, --filename <filename>    Custom filename to use for the file
  -t, --token <token>          API token for authentication (default: from env var API_TOKEN)
  --noauth                     Skip authentication (will demonstrate auth failure)

Examples:
  bun run demo.ts upload demo_1.png
  bun run demo.ts ingest https://example.com/image.jpg --filename my-custom-name.jpg
  bun run demo.ts get abc123def456
  bun run demo.ts upload demo_1.png --url https://your-api.example.com/api
  bun run demo.ts upload demo_1.png --token your-api-token
  bun run demo.ts upload demo_1.png --noauth  # Demonstrate auth failure
`)
}

// Creates headers with or without authentication
function createHeaders(contentType?: string): HeadersInit {
  const headers: HeadersInit = {}

  if (contentType) {
    headers['Content-Type'] = contentType
  }

  // Add authorization header if token is available and noauth is not set
  if (values.token && !values.noauth) {
    headers.Authorization = `Bearer ${values.token}`
    console.log('Using authentication token')
  }
  else if (values.noauth) {
    console.log('Authentication disabled with --noauth flag')
  }
  else {
    console.log('No authentication token provided. Use --token or set API_TOKEN env var')
  }

  return headers
}

// Helper function to display file details
function displayFileDetails(data: any) {
  console.log('Details:')
  console.log(`- ID: ${data.externalId}`)
  console.log(`- Content Hash: ${data.contentHash}`)
  console.log(`- Size: ${formatBytes(data.size)}`)
  console.log(`- Content Type: ${data.contentType}`)
  console.log(`- Filename: ${data.filename}`)
  console.log(`- Created At: ${new Date(data.createdAt).toLocaleString()}`)

  if (data.metadata) {
    console.log('Metadata:')
    if (data.metadata.width && data.metadata.height) {
      console.log(`- Dimensions: ${data.metadata.width}×${data.metadata.height}`)
    }
    if (data.metadata.format) {
      console.log(`- Format: ${data.metadata.format}`)
    }
  }

  console.log(`\nTo retrieve this file: bun run demo.ts get ${data.externalId}`)
  console.log(`\nOr visit ${API_BASE_URL}${PATH_SERVE}/${data.externalId}`)
}

// Upload a file
async function uploadFile(filepath?: string) {
  if (!filepath) {
    console.error('Error: Missing filepath')
    showHelp()
    process.exit(1)
  }

  const fullPath = join(import.meta.dirname, filepath)
  const originalFilename = basename(filepath)

  try {
    // Read the file
    const fileBuffer = await readFile(fullPath)

    // Create form data
    const formData = new FormData()
    const file = new File([fileBuffer], originalFilename, {
      type: getContentType(originalFilename),
    })

    formData.append('file', file)

    // Use custom filename if provided, otherwise use the original filename
    const customFilename = values.filename || originalFilename
    formData.append('filename', customFilename)

    console.log(`Uploading ${originalFilename} (${formatBytes(fileBuffer.byteLength)})...`)
    if (values.filename) {
      console.log(`Using custom filename: ${customFilename}`)
    }

    // Make the API request with authentication header
    const response = await fetch(`${values.url}${PATH_UPLOAD}`, {
      method: 'POST',
      headers: createHeaders(),
      body: formData,
      verbose: true,
    })

    // Parse response
    const data = (await response.json()) as any

    // Display results
    if (response.ok) {
      console.log('✅ File uploaded successfully!')
      displayFileDetails(data)
    }
    else {
      console.error('❌ Upload failed!')
      console.error(`Status: ${response.status} ${response.statusText}`)
      console.error('Response:', data)
    }
  }
  catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.error(`Error: File "${originalFilename}" not found in the demo directory`)
    }
    else {
      throw error
    }
  }
}

// Ingest an image from a URL
async function ingestImageUrl(url?: string) {
  if (!url) {
    console.error('Error: Missing URL')
    showHelp()
    process.exit(1)
  }

  try {
    console.log(`Ingesting image from URL: ${url}...`)

    if (values.filename) {
      console.log(`Using custom filename: ${values.filename}`)
    }

    // Create request payload
    const payload = {
      url,
      filename: values.filename,
    }

    // Make the API request with authentication header
    const response = await fetch(`${values.url}${PATH_INGEST}`, {
      method: 'POST',
      headers: createHeaders('application/json'),
      body: JSON.stringify(payload),
    })

    // Parse response
    const data = (await response.json()) as any

    // Display results
    if (response.ok) {
      console.log('✅ Image ingested successfully!')
      displayFileDetails(data)
    }
    else {
      console.error('❌ Ingestion failed!')
      console.error(`Status: ${response.status} ${response.statusText}`)
      console.error('Response:', data)
    }
  }
  catch (error) {
    console.error('Error ingesting image from URL:', error)
    throw error
  }
}

// Get a file by hash
async function getFile(hash?: string) {
  if (!hash) {
    console.error('Error: Missing hash')
    showHelp()
    process.exit(1)
  }

  console.log(`Retrieving file with hash ${hash}...`)

  // Make the API request with authentication header
  const response = await fetch(`${values.url}${PATH_INFO}/${hash}`, {
    headers: createHeaders(),
  })

  // Parse response
  const data = (await response.json()) as any

  // Display results
  if (response.ok) {
    console.log('✅ File retrieved successfully!')
    displayFileDetails(data)
  }
  else {
    console.error('❌ Retrieval failed!')
    console.error(`Status: ${response.status} ${response.statusText}`)
    console.error('Response:', data)
  }
}

// Helper function to format bytes to human-readable format
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`
}

// Helper function to determine content type from filename
function getContentType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()

  const contentTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
  }

  return contentTypes[extension || ''] || 'application/octet-stream'
}

// Run the main function
main().catch(console.error)
