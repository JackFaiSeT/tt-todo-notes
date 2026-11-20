import { readMigrationFiles } from 'drizzle-orm/migrator'
import { DATABASE_ERROR_MESSAGES, DATABASE_PRAGMAS, MIGRATION_STATEMENTS } from './constants'
import type { NotesDatabase } from './connection'

export const migrateDatabase = (database: NotesDatabase, migrationsFolder: string): void => {
  const sqlite = database.$client
  const migrations = readMigrationFiles({ migrationsFolder })

  const applyPending = sqlite.transaction(() => {
    sqlite.exec(MIGRATION_STATEMENTS.CREATE_TABLE)

    const last = sqlite.prepare<[], number | null>(MIGRATION_STATEMENTS.SELECT_LAST).pluck().get()
    const record = sqlite.prepare(MIGRATION_STATEMENTS.INSERT)

    for (const migration of migrations) {
      if (last != null && migration.folderMillis <= last) {
        continue
      }

      for (const statement of migration.sql) {
        sqlite.exec(statement)
      }

      record.run(migration.hash, migration.folderMillis)
    }

    if (sqlite.prepare(MIGRATION_STATEMENTS.FOREIGN_KEY_CHECK).get()) {
      throw new Error(DATABASE_ERROR_MESSAGES.FOREIGN_KEYS)
    }
  })

  sqlite.pragma(DATABASE_PRAGMAS.FOREIGN_KEYS_OFF)

  try {
    applyPending.immediate()
  } finally {
    sqlite.pragma(DATABASE_PRAGMAS.FOREIGN_KEYS_ON)
  }
}
