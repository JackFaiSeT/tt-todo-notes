import { describe, expect, it } from 'vitest'
import { OPERATION_TYPES } from '@shared/contract/notes/constants'
import { NotesAdapter } from '@notes/adapter'
import { operations, todo } from '../../../factories/history'
import { createNewDraft } from '../../../factories/notes'

describe('Notes/NotesAdapter', () => {
  it.each([
    { count: 42, expected: 42 },
    { count: null, expected: 0 }
  ])('should report a collection size of $expected when the page count is $count', ({ count, expected }) => {
    expect(new NotesAdapter().toPage({ items: [], nextCursor: null, count }).count).toBe(expected)
  })

  it('should retain legacy content when reading a draft with extra storage fields', () => {
    const data = { ...createNewDraft(), content: { title: 'До\tобновления', todos: [] }, legacy: true }

    expect(new NotesAdapter().toDraft(data).content).toEqual(data.content)
  })

  it('should reject a stored draft when operation text contains a control character', () => {
    const data = {
      ...createNewDraft(),
      history: { undo: [{ type: OPERATION_TYPES.TITLE, before: '', after: 'a\tb' }], redo: [] }
    }

    expect(() => new NotesAdapter().toDraft(data)).toThrow(TypeError)
  })

  it('should reject an empty response when the identifier is missing', () => {
    expect(() => new NotesAdapter().toSummary({})).toThrow(TypeError)
  })

  it('should reject a todo when its identifier is malformed', () => {
    expect(() => new NotesAdapter().toModel({ id: 'one', todos: [{ id: 'bad id' }] })).toThrow(TypeError)
  })

  it.each(
    [OPERATION_TYPES.TODO_ADD, OPERATION_TYPES.TODO_REMOVE].flatMap((type) =>
      [-1, 1.2, Infinity, '1', NaN].map((index) => ({ type, index }))
    )
  )('should reject $type when its stored position is $index', ({ type, index }) => {
    const history = JSON.parse(JSON.stringify({ undo: [{ type, index, todo }], redo: [] }))

    expect(() => new NotesAdapter().toDraft({ ...createNewDraft(), history })).toThrow(TypeError)
  })

  it('should supply defaults when optional payload fields are null', () => {
    expect(new NotesAdapter().toModel({ id: 'one', todos: null })).toEqual({
      id: 'one',
      title: '',
      version: 1,
      todos: [],
      createdAt: 0,
      updatedAt: 0
    })
  })

  it('should round-trip each history operation when serializing a restored draft', () => {
    const adapter = new NotesAdapter()
    const dto = { ...createNewDraft(), history: { undo: operations.slice(0, 3), redo: operations.slice(3) } }
    const model = adapter.toDraft(dto)

    expect(model).not.toHaveProperty('schemaVersion')

    const body = adapter.toDraftBody(model, 2)

    expect(body).toEqual({ draft: dto, observedVersion: 2 })
    dto.history.undo.length = 0
    expect(model.history.undo).toHaveLength(3)
    model.history.redo.length = 0
    expect(body.draft.history.redo).toHaveLength(2)
  })

  it('should select only protocol fields when serializing an edited todo', () => {
    const content = { title: 'Заметка', todos: [{ ...todo, isFocused: true }] }

    expect(new NotesAdapter().toCreateBody(content, { isCopy: true })).toEqual({
      title: content.title,
      todos: [todo],
      fromDeletedNote: true
    })
  })
})
