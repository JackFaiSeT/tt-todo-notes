import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SOURCE_MIGRATIONS_PATH } from '#server/config/migrations'
import { openDatabase } from '#server/database/connection'
import { migrateDatabase } from '#server/database/migrations'
import { createNotesModule, listQuerySchema } from '#server/modules/notes'
import { ERROR_CODES } from '@shared/contract/http'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { parseTodoId } from '@shared/contract/notes/ids'
import type { NoteContent } from '@shared/contract/notes/types'
import { createChecklist, createContent, createNewDraft } from '../../../../factories/notes'

describe('Notes/Module', () => {
  let database: ReturnType<typeof openDatabase>
  let service: ReturnType<typeof createNotesModule>

  beforeEach(() => {
    database = openDatabase(':memory:')
    migrateDatabase(database, SOURCE_MIGRATIONS_PATH)
    service = createNotesModule(database)
  })

  afterEach(() => database.$client.close())

  it('should roll back note and todo changes when a replacement insert fails', () => {
    const note = service.create(createContent())
    const draft = { ...createNewDraft(), noteId: note.id, baseVersion: 1 }

    service.putDraft(note.id, { draft })

    database.$client.exec(
      "CREATE TRIGGER fail_insert BEFORE INSERT ON todos BEGIN SELECT RAISE(ABORT, 'replacement rejected'); END"
    )

    expect(() => service.update(note.id, { ...createContent(), title: 'После', baseVersion: 1 })).toThrow(
      /replacement rejected/u
    )

    expect(service.get(note.id)).toEqual(note)
    expect(service.draft(note.id)).toEqual(draft)
  })

  it('should report an unreadable draft when its stored JSON is malformed', () => {
    service.putDraft(NEW_DRAFT_KEY, { draft: createNewDraft() })
    database.$client.prepare('UPDATE drafts SET payload = ?').run('{')

    expect(() => service.draft(NEW_DRAFT_KEY)).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.DRAFT_UNREADABLE })
    )
  })

  it.each([
    ["UPDATE notes SET version = 'text'"],
    ["UPDATE notes SET title = printf('%0201d', 0)"],
    ["UPDATE todos SET text = printf('%0501d', 0)"],
    ['UPDATE todos SET position = 200'],
    ['UPDATE todos SET position = 1.5'],
    ["UPDATE drafts SET saved_at = 'yesterday'"]
  ])('should enforce storage constraints when executing %s', (statement) => {
    service.create(createContent())
    service.putDraft(NEW_DRAFT_KEY, { draft: createNewDraft() })
    expect(() => database.$client.exec(statement)).toThrow(/CHECK constraint/u)
  })

  it('should reject duplicate positions even when writing directly to SQLite', () => {
    const { id } = service.create(createContent())

    expect(() =>
      database.$client.prepare('INSERT INTO todos VALUES (?, ?, ?, ?, ?)').run('other', id, 0, 'X', 0)
    ).toThrow(/UNIQUE/u)
  })

  it('should count all items and project the first four in position order when listing notes', () => {
    const note = service.create(createChecklist(7, 3))

    expect(service.list({ limit: 1 })).toEqual({
      nextCursor: null,
      count: 1,
      items: [
        {
          id: note.id,
          title: 'План',
          version: 1,
          updatedAt: note.updatedAt,
          total: 7,
          completed: 3,
          preview: note.todos.slice(0, 4)
        }
      ]
    })
  })

  const titled = (title: string, ...texts: string[]): NoteContent => ({
    title,
    todos: texts.map((text, index) => ({ id: parseTodoId('item-' + index), text, done: false }))
  })

  const titlesOf = (search: string, limit = 10): string[] =>
    service.list({ limit, search }).items.map((note) => note.title)

  it('should report the size of the whole collection when only one page is returned', () => {
    for (let index = 0; index < 5; index++) {
      service.create(titled('Заметка ' + index))
    }

    const page = service.list({ limit: 2 })

    expect(page.items).toHaveLength(2)
    expect(page.count).toBe(5)
  })

  it.each([
    ['a title in another case', 'КУХН', ['Ремонт кухни']],
    ['an item text', 'молоко', ['Покупки']],
    ['a part of a word', 'упк', ['Покупки']],
    ['text that matches nothing', 'отпуск', []]
  ])('should find notes when the query is %s', (_case, search, expected) => {
    service.create(titled('Ремонт кухни', 'Купить краску'))
    service.create(titled('Покупки', 'Хлеб', 'Молоко'))

    expect(titlesOf(search)).toEqual(expected)
    expect(service.list({ limit: 10, search }).count).toBe(expected.length)
  })

  it.each(['%', '_', '\\'])('should treat %s as a plain character when searching', (character) => {
    service.create(titled('Скидка 50' + character, 'Без символа'))
    service.create(titled('Скидка 500', 'Без символа'))

    expect(titlesOf(character)).toEqual(['Скидка 50' + character])
  })

  it('should return every match once and nothing else when a search continues by cursor', () => {
    for (let index = 0; index < 5; index++) {
      service.create(titled('Поиск ' + index))
      service.create(titled('Другое ' + index))
    }

    const first = service.list(listQuerySchema.parse({ limit: '2', q: 'поиск' }))
    const rest = service.list(listQuerySchema.parse({ limit: '10', q: 'поиск', cursor: first.nextCursor }))

    expect([...first.items, ...rest.items].map((note) => note.title).sort()).toEqual([
      'Поиск 0',
      'Поиск 1',
      'Поиск 2',
      'Поиск 3',
      'Поиск 4'
    ])

    expect(rest.nextCursor).toBeNull()
    expect(rest.count).toBe(5)
  })

  it('should preserve the submitted item order when empty items are removed on update', () => {
    const note = service.create(createChecklist(3, 1))

    service.update(note.id, {
      title: ' ',
      baseVersion: 1,
      todos: [{ id: parseTodoId('blank'), text: ' ', done: false }, ...note.todos.toReversed()]
    })

    expect(service.get(note.id).todos).toEqual(note.todos.toReversed())
  })

  it('should return null when no draft has been written', () => {
    expect(service.draft(NEW_DRAFT_KEY)).toBeNull()
  })
})
