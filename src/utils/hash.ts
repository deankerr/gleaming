import { blake3 } from '@noble/hashes/blake3'
import { bytesToHex } from '@noble/hashes/utils'

/**
 * Generate a BLAKE3 hash from binary data
 * @param data - The data to hash
 * @returns The hash as a hex string
 */
export async function generateHash(data: ArrayBuffer | Uint8Array): Promise<string> {
  // Convert ArrayBuffer to Uint8Array if needed
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data
  const hash = blake3(bytes)
  return bytesToHex(hash)
}

/**
 * Generate a BLAKE3 hash from a stream
 * @param stream - The stream to hash
 * @returns The hash as a hex string
 */
export async function generateHashFromStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()

  // Create a buffer to store the chunks
  const chunks: Uint8Array[] = []
  let totalLength = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      chunks.push(value)
      totalLength += value.length
    }

    // Combine all chunks
    const fullBuffer = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      fullBuffer.set(chunk, offset)
      offset += chunk.length
    }

    // Generate the hash
    return generateHash(fullBuffer)
  } finally {
    reader.releaseLock()
  }
}

/**
 * Clone a ReadableStream so it can be consumed multiple times
 * @param stream - The stream to clone
 * @returns Two new readable streams with the same content
 */
export function cloneStream(
  stream: ReadableStream<Uint8Array>,
): [ReadableStream<Uint8Array>, ReadableStream<Uint8Array>] {
  const [stream1, stream2] = stream.tee()
  return [stream1, stream2]
}
