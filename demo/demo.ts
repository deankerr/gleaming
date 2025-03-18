#!/usr/bin/env bun
import { readFile } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { parseArgs } from 'node:util'

// Configuration constants
const API_BASE_URL = 'http://localhost:8787/api'
const DEFAULT_USERNAME = 'test-user'

// Command line arguments parsing
const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    url: {
      type: 'string',
      short: 'u',
      default: API_BASE_URL,
    },
  },
  allowPositionals: true,
})

// Command handlers
const commands = {
  upload: uploadFile,
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
  } catch (error) {
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
  get <hash>                   Get a file by its content hash
  help                         Show this help message

Options:
  -u, --url <url>              API base URL (default: ${API_BASE_URL})

Examples:
  bun run demo.ts upload demo_1.png
  bun run demo.ts get abc123def456
  bun run demo.ts upload demo_1.png --url https://your-api.example.com/api
`)
}

// Upload a file
async function uploadFile(filename?: string) {
  if (!filename) {
    console.error('Error: Missing filename')
    showHelp()
    process.exit(1)
  }

  const filepath = join(__dirname, filename)

  try {
    // Read the file
    const fileBuffer = await readFile(filepath)

    // Create form data
    const formData = new FormData()
    const file = new File([fileBuffer], basename(filename), {
      type: getContentType(filename),
    })

    formData.append('file', file)

    // Optional: Add a slug based on the filename without extension
    const slug = basename(filename).split('.')[0]
    // formData.append('slug', slug)

    console.log(`Uploading ${filename} (${formatBytes(fileBuffer.byteLength)})...`)
    console.log(formData)
    // Make the API request
    const response = await fetch(`${values.url}/files`, {
      method: 'POST',
      body: formData,
      verbose: true,
    })

    // Parse response
    const data = (await response.json()) as any

    // Display results
    if (response.ok) {
      console.log('✅ File uploaded successfully!')
      console.log('Details:')
      console.log(`- ID: ${data.id}`)
      console.log(`- Content Hash: ${data.contentHash}`)
      console.log(`- Size: ${formatBytes(data.size)}`)
      console.log(`- Content Type: ${data.contentType}`)
      console.log(`- Slug: ${data.slug}`)

      if (data.metadata) {
        console.log('Metadata:')
        if (data.metadata.width && data.metadata.height) {
          console.log(`- Dimensions: ${data.metadata.width}×${data.metadata.height}`)
        }
        if (data.metadata.format) {
          console.log(`- Format: ${data.metadata.format}`)
        }
      }

      console.log(`\nTo retrieve this file: bun run demo.ts get ${data.contentHash}`)
    } else {
      console.error('❌ Upload failed!')
      console.error(`Status: ${response.status} ${response.statusText}`)
      console.error('Response:', data)
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.error(`Error: File "${filename}" not found in the demo directory`)
    } else {
      throw error
    }
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

  try {
    // Make the API request
    const response = await fetch(`${values.url}/files/${hash}`)

    // Parse response
    const data = (await response.json()) as any

    // Display results
    if (response.ok) {
      console.log('✅ File retrieved successfully!')
      console.log('Details:')
      console.log(`- ID: ${data.id}`)
      console.log(`- Content Hash: ${data.contentHash}`)
      console.log(`- Size: ${formatBytes(data.size)}`)
      console.log(`- Content Type: ${data.contentType}`)
      console.log(`- Slug: ${data.slug}`)
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
    } else {
      console.error('❌ Retrieval failed!')
      console.error(`Status: ${response.status} ${response.statusText}`)
      console.error('Response:', data)
    }
  } catch (error) {
    throw error
  }
}

// Helper function to format bytes to human-readable format
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
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
