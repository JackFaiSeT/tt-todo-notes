import { defineConfig } from 'drizzle-kit'
import { SOURCE_MIGRATIONS_PATH } from './src/server/config/migrations'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/server/database/schema.ts',
  out: SOURCE_MIGRATIONS_PATH
})
