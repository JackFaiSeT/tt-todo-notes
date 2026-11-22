import { readMigrationFiles } from 'drizzle-orm/migrator'
import { SOURCE_MIGRATIONS_PATH } from '#server/config/migrations'
import { openDatabase } from '#server/database/connection'

export const openFirstRoundDatabase = (path: string = ':memory:'): ReturnType<typeof openDatabase> => {
  const database = openDatabase(path)
  const [first] = readMigrationFiles({ migrationsFolder: SOURCE_MIGRATIONS_PATH })

  if (!first) {
    throw new Error('Initial migration missing')
  }

  const sqlite = database.$client

  sqlite.exec(first.sql.join('\n'))
  sqlite.exec('CREATE TABLE __drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)')

  sqlite.prepare('INSERT INTO __drizzle_migrations(hash, created_at) VALUES (?, ?)').run(first.hash, first.folderMillis)

  return database
}
