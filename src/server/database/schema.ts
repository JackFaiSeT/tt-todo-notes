import { sql } from 'drizzle-orm'
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { ITEM_LIMIT, TITLE_LIMIT, TODO_LIMIT } from '@shared/contract/notes/constants'

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    version: integer('version').notNull()
  },
  (table) => [
    index('notes_list_cursor').on(sql`${table.updatedAt} DESC`, table.id),
    check(
      'notes_storage_types',
      sql`typeof(${table.id}) = 'text' AND typeof(${table.title}) = 'text' AND typeof(${table.createdAt}) = 'integer' AND typeof(${table.updatedAt}) = 'integer' AND typeof(${table.version}) = 'integer'`
    ),
    check('notes_title_limit', sql`length(${table.title}) <= ${sql.raw(String(TITLE_LIMIT))}`),
    check('notes_positive_version', sql`${table.version} >= 1`)
  ]
)

export const todos = sqliteTable(
  'todos',
  {
    id: text('id').notNull(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    text: text('text').notNull(),
    done: integer('done', { mode: 'boolean' }).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.noteId, table.id] }),
    uniqueIndex('todos_note_position').on(table.noteId, table.position),
    check(
      'todos_storage_types',
      sql`typeof(${table.id}) = 'text' AND typeof(${table.noteId}) = 'text' AND typeof(${table.position}) = 'integer' AND typeof(${table.done}) = 'integer' AND typeof(${table.text}) = 'text'`
    ),
    check('todos_position_range', sql`${table.position} >= 0 AND ${table.position} < ${sql.raw(String(ITEM_LIMIT))}`),
    check('todos_text_limit', sql`length(${table.text}) <= ${sql.raw(String(TODO_LIMIT))}`),
    check('todos_done_boolean', sql`${table.done} IN (0, 1)`)
  ]
)

export const drafts = sqliteTable(
  'drafts',
  {
    key: text('key').primaryKey(),
    baseVersion: integer('base_version'),
    payload: text('payload').notNull(),
    savedAt: integer('saved_at').notNull(),
    noteId: text('note_id')
      .generatedAlwaysAs(sql`nullif("key", 'new')`, { mode: 'virtual' })
      .references(() => notes.id, { onDelete: 'cascade' })
  },
  (table) => [
    index('drafts_note').on(table.noteId),
    check(
      'drafts_storage_types',
      sql`typeof(${table.key}) = 'text' AND typeof(${table.payload}) = 'text' AND typeof(${table.savedAt}) = 'integer' AND typeof(${table.baseVersion}) IN ('null', 'integer')`
    ),
    check(
      'drafts_base_version',
      sql`(${table.key} = 'new' AND ${table.baseVersion} IS NULL) OR (${table.key} <> 'new' AND ${table.baseVersion} IS NOT NULL AND ${table.baseVersion} > 0)`
    )
  ]
)
