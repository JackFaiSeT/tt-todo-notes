import { mkdirSync, mkdtempDisposableSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { SOURCE_MIGRATIONS_PATH } from '#server/config/migrations'
import { migrateDatabase } from '#server/database/migrations'
import { createNotesModule } from '#server/modules/notes'
import { parseNoteId } from '@shared/contract/notes/ids'
import { openFirstRoundDatabase } from '../../../factories/first-round-database'
import { createNewDraft } from '../../../factories/notes'
import { TEST_TEMP_ROOT } from '../../../setup/paths'

describe('Database/Migrations', () => {
  it('should roll back a new migration when it leaves an invalid foreign key', () => {
    mkdirSync(TEST_TEMP_ROOT, { recursive: true })
    using directory = mkdtempDisposableSync(join(TEST_TEMP_ROOT, 'migration-'))
    mkdirSync(join(directory.path, 'meta'))

    const entry = { when: Date.now(), tag: 'next', breakpoints: false }

    writeFileSync(join(directory.path, 'meta/_journal.json'), JSON.stringify({ entries: [entry] }))
    writeFileSync(join(directory.path, 'next.sql'), "INSERT INTO todos VALUES ('item', 'missing', 0, '', 0)")

    const database = openFirstRoundDatabase()

    try {
      migrateDatabase(database, SOURCE_MIGRATIONS_PATH)

      const journal = database.$client.prepare('SELECT count(*) FROM __drizzle_migrations').pluck()
      const before = journal.get()

      expect(() => migrateDatabase(database, directory.path)).toThrow('Нарушена целостность')
      expect(journal.get()).toBe(before)
      expect(database.$client.prepare('SELECT id FROM todos').get()).toBeUndefined()
      expect(database.$client.pragma('foreign_keys', { simple: true })).toBe(1)
    } finally {
      database.$client.close()
    }
  })

  it('should roll back the migration journal and schema when a legacy draft has no parent', () => {
    const database = openFirstRoundDatabase()

    try {
      database.$client.prepare('INSERT INTO drafts VALUES (?, ?, ?, ?)').run('orphan', 1, '{}', 1)
      expect(() => migrateDatabase(database, SOURCE_MIGRATIONS_PATH)).toThrow(/CHECK constraint failed: violations/u)
      expect(database.$client.prepare('SELECT count(*) FROM __drizzle_migrations').pluck().get()).toBe(1)
      expect(database.$client.prepare('SELECT key FROM drafts').pluck().get()).toBe('orphan')
      expect(database.$client.pragma('foreign_keys', { simple: true })).toBe(1)
    } finally {
      database.$client.close()
    }
  })

  it('should retain first-round todos and drafts when upgrading a populated database twice', () => {
    const database = openFirstRoundDatabase()

    try {
      const sqlite = database.$client

      const id = parseNoteId('retained')

      sqlite.prepare('INSERT INTO notes VALUES (?, ?, ?, ?, ?)').run(id, 'До обновления', 10, 10, 1)
      sqlite.prepare('INSERT INTO todos VALUES (?, ?, ?, ?, ?)').run('first', id, 0, 'Пункт', 1)

      const draft = { ...createNewDraft(), noteId: id, baseVersion: 1, content: { title: 'До\tобновления', todos: [] } }

      sqlite
        .prepare('INSERT INTO drafts VALUES (?, ?, ?, ?)')
        .run(id, 1, JSON.stringify({ ...draft, legacy: true }), 123)

      sqlite.prepare('INSERT INTO drafts VALUES (?, ?, ?, ?)').run('new', null, JSON.stringify(createNewDraft()), 123)
      migrateDatabase(database, SOURCE_MIGRATIONS_PATH)
      migrateDatabase(database, SOURCE_MIGRATIONS_PATH)

      const service = createNotesModule(database)

      expect(service.get(id).todos).toEqual([{ id: 'first', text: 'Пункт', done: true }])
      expect(service.draft(id)).toEqual(draft)

      expect(sqlite.prepare('SELECT count(*) FROM __drizzle_migrations').pluck().get()).toBe(
        readMigrationFiles({ migrationsFolder: SOURCE_MIGRATIONS_PATH }).length
      )

      sqlite.prepare('DELETE FROM notes WHERE id = ?').run(id)
      expect(service.draft(id)).toBeNull()
      expect(service.draft('new')).toEqual(createNewDraft())
    } finally {
      database.$client.close()
    }
  })
})
