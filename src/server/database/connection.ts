import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { MEMORY_DATABASE_PATH } from '#server/config'
import { DATABASE_FUNCTIONS, DATABASE_PRAGMAS, SEARCH_LOCALE } from './constants'
import * as schema from './schema'

export type NotesDatabase = ReturnType<typeof drizzle<typeof schema>>

export const openDatabase = (path: string): NotesDatabase => {
  if (path !== MEMORY_DATABASE_PATH) {
    mkdirSync(dirname(path), { recursive: true })
  }

  const sqlite = new Database(path)

  try {
    sqlite.pragma(DATABASE_PRAGMAS.BUSY_TIMEOUT)
    sqlite.pragma(DATABASE_PRAGMAS.JOURNAL_MODE)
    sqlite.pragma(DATABASE_PRAGMAS.FOREIGN_KEYS_ON)
    sqlite.pragma(DATABASE_PRAGMAS.SECURE_DELETE)

    sqlite.function(DATABASE_FUNCTIONS.UNICODE_LOWER, { deterministic: true }, (value: unknown) =>
      typeof value === 'string' ? value.toLocaleLowerCase(SEARCH_LOCALE) : value
    )

    return drizzle(sqlite, { schema })
  } catch (error) {
    sqlite.close()
    throw error
  }
}
