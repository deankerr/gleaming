import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './.wrangler/state/v3/d1/miniflare-D1DatabaseObject/02b1bb9ffb24d6f30d4d6f07289de29173bfe5ba7d7f94525ce7b52bfb740fae.sqlite',
  },
} satisfies Config
