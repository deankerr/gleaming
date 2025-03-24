/* eslint-disable node/prefer-global/process */
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.DRIZZLE_CF_ACCOUNT_ID!,
    databaseId: process.env.DRIZZLE_CF_DATABASE_ID!,
    token: process.env.DRIZZLE_CF_API_TOKEN!,
  },
} satisfies Config
