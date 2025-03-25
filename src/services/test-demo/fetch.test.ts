import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
// Could import any other source file/function here
import worker from './fetch'

// NOTE: This is a demo of using vitest/miniflare to test a worker.

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>

describe('hello world worker', () => {
  it('responds with Hello World!', async () => {
    // Create a new Request
    const request = new IncomingRequest('http://example.com')

    // Create an empty context to pass to `worker.fetch()`
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, env, ctx)

    // Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
    await waitOnExecutionContext(ctx)

    expect(await response.text()).toBe('Hello World!')
  })
})
