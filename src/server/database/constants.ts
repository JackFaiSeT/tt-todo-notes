export const DATABASE_FUNCTIONS = {
  UNICODE_LOWER: 'unicode_lower'
} as const

export const SEARCH_LOCALE = 'ru-RU'

export const LIKE_ESCAPE = '\\'

const MIGRATIONS_TABLE = '__drizzle_migrations'

export const DATABASE_PRAGMAS = {
  BUSY_TIMEOUT: 'busy_timeout = 5000',
  JOURNAL_MODE: 'journal_mode = WAL',
  FOREIGN_KEYS_ON: 'foreign_keys = ON',
  SECURE_DELETE: 'secure_delete = ON',
  FOREIGN_KEYS_OFF: 'foreign_keys = OFF'
} as const

export const MIGRATION_STATEMENTS = {
  CREATE_TABLE: `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)`,
  SELECT_LAST: `SELECT max(created_at) FROM ${MIGRATIONS_TABLE}`,
  INSERT: `INSERT INTO ${MIGRATIONS_TABLE} (hash, created_at) VALUES (?, ?)`,
  FOREIGN_KEY_CHECK: 'PRAGMA foreign_key_check',
  PROBE: `SELECT created_at FROM ${MIGRATIONS_TABLE} LIMIT 1`
} as const

export const TRANSACTION_BEHAVIORS = {
  IMMEDIATE: 'immediate'
} as const

export const DATABASE_ERROR_MESSAGES = {
  FOREIGN_KEYS: 'Нарушена целостность связей SQLite.'
} as const
