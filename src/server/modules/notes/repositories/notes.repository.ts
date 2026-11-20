import { and, asc, desc, eq, gt, inArray, lt, lte, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { DATABASE_FUNCTIONS, LIKE_ESCAPE, SEARCH_LOCALE } from '#server/database/constants'
import { notes, todos } from '#server/database/schema'
import type { DatabaseClient } from '#server/database/transactions'
import { NOTE_PREVIEW_TEXT_MAX, NOTE_PREVIEW_TODOS_MAX } from '@shared/contract/notes/constants'
import { parseNoteId, parseTodoId } from '@shared/contract/notes/ids'
import type { NoteId } from '@shared/contract/notes/ids'
import type { Note, NotePage, Todo } from '@shared/contract/notes/types'
import type { ListNotesQuery, INotesRepository } from '../types'
import { encodeCursor } from '../utils/cursor'

const todoFields = { id: todos.id, text: todos.text, done: todos.done }

const noteFields = { id: notes.id, title: notes.title, updatedAt: notes.updatedAt, version: notes.version }

const LIKE_SPECIAL_CHARACTERS = /[\\%_]/gu

const toLikePattern = (search: string): string =>
  `%${search.toLocaleLowerCase(SEARCH_LOCALE).replace(LIKE_SPECIAL_CHARACTERS, (character) => LIKE_ESCAPE + character)}%`

const lowered = (column: SQL | typeof notes.title | typeof todos.text): SQL =>
  sql`${sql.raw(DATABASE_FUNCTIONS.UNICODE_LOWER)}(${column})`

const toSearchFilter = (search: string | undefined): SQL | undefined => {
  if (!search) {
    return undefined
  }

  const pattern = toLikePattern(search)

  return or(
    sql`${lowered(notes.title)} like ${pattern} escape ${LIKE_ESCAPE}`,
    sql`exists (select 1 from ${todos} where ${todos.noteId} = ${notes.id} and ${lowered(todos.text)} like ${pattern} escape ${LIKE_ESCAPE})`
  )
}

export class NotesRepository implements INotesRepository<DatabaseClient> {
  listSummaries({ limit, cursor, search }: ListNotesQuery, client: DatabaseClient): NotePage {
    const matches = toSearchFilter(search)

    const count =
      client
        .select({ count: sql<number>`count(*)` })
        .from(notes)
        .where(matches)
        .get()?.count ?? 0

    const afterCursor =
      cursor &&
      and(lte(notes.updatedAt, cursor.updatedAt), or(lt(notes.updatedAt, cursor.updatedAt), gt(notes.id, cursor.id)))

    const rows = client
      .select({
        ...noteFields,
        total: sql<number>`(select count(*) from ${todos} where ${todos.noteId} = ${notes}.${sql.identifier(notes.id.name)})`,
        completed: sql<number>`(select count(*) from ${todos} where ${todos.noteId} = ${notes}.${sql.identifier(notes.id.name)} and ${todos.done} = 1)`
      })
      .from(notes)
      .where(and(matches, afterCursor))
      .orderBy(desc(notes.updatedAt), asc(notes.id))
      .limit(limit + 1)
      .all()

    const page = rows.slice(0, limit)
    const last = page.at(-1)

    if (!last) {
      return { items: [], nextCursor: null, count }
    }

    const previews = new Map<string, Todo[]>()

    for (const { noteId, id, ...todo } of client
      .select({
        noteId: todos.noteId,
        ...todoFields,
        text: sql<string>`substr(${todos.text}, 1, ${NOTE_PREVIEW_TEXT_MAX})`
      })
      .from(todos)
      .where(
        and(
          inArray(
            todos.noteId,
            page.map((row) => row.id)
          ),
          lt(todos.position, NOTE_PREVIEW_TODOS_MAX)
        )
      )
      .orderBy(todos.noteId, todos.position)
      .all()) {
      const preview = previews.get(noteId) ?? []

      preview.push({ ...todo, id: parseTodoId(id) })
      previews.set(noteId, preview)
    }

    return {
      items: page.map((row) => ({ ...row, id: parseNoteId(row.id), preview: previews.get(row.id) ?? [] })),
      nextCursor: rows.length > limit ? encodeCursor({ updatedAt: last.updatedAt, id: parseNoteId(last.id) }) : null,
      count
    }
  }

  findVersion(id: NoteId, client: DatabaseClient): number | undefined {
    return client.select({ version: notes.version }).from(notes).where(eq(notes.id, id)).get()?.version
  }

  findNote(id: NoteId, client: DatabaseClient): Note | undefined {
    const row = client
      .select({ ...noteFields, createdAt: notes.createdAt })
      .from(notes)
      .where(eq(notes.id, id))
      .get()

    if (!row) {
      return undefined
    }

    const items = client.select(todoFields).from(todos).where(eq(todos.noteId, id)).orderBy(todos.position).all()

    return { ...row, id: parseNoteId(row.id), todos: items.map((todo) => ({ ...todo, id: parseTodoId(todo.id) })) }
  }

  insertNote(note: Note, client: DatabaseClient): void {
    const { todos: items, ...row } = note

    client.insert(notes).values(row).run()
    this.insertTodos(note.id, items, client)
  }

  updateNote(note: Note, client: DatabaseClient): void {
    const { id, title, version, updatedAt } = note

    client.update(notes).set({ title, version, updatedAt }).where(eq(notes.id, id)).run()
    client.delete(todos).where(eq(todos.noteId, id)).run()
    this.insertTodos(id, note.todos, client)
  }

  removeNote(id: NoteId, client: DatabaseClient): void {
    client.delete(notes).where(eq(notes.id, id)).run()
  }

  private insertTodos(noteId: NoteId, items: Todo[], client: DatabaseClient): void {
    if (items.length) {
      client
        .insert(todos)
        .values(items.map((todo, position) => ({ ...todo, noteId, position })))
        .run()
    }
  }
}
