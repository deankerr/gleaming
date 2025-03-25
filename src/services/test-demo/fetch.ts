/* eslint-disable unused-imports/no-unused-vars */

// NOTE: This is a demo of using vitest/miniflare to test a worker.

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/404') {
      return new Response('Not found', { status: 404 })
    }

    return new Response('Hello World!')
  },
} satisfies ExportedHandler<CloudflareBindings>
