import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          kvNamespaces: ['KV_FETCH_SERVICE'],
          r2Buckets: ['BUCKET'],
          d1Databases: ['DB'],
        },
      },
    },
  },
})
