import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { putDraftSchema } from '#server/modules/notes/dto'
import { DRAFT_SCHEMA_VERSION, HISTORY_LIMIT, OPERATION_TYPES } from '@shared/contract/notes/constants'
import { readStoredDraft } from '@shared/contract/notes/stored-draft'

const id = fc.stringMatching(/^[A-Za-z0-9_-]{1,12}$/u)

const text = fc.string({ maxLength: 40 })

const todo = fc.record({ id, text, done: fc.boolean() })

const operation = fc.oneof(
  fc.record({ type: fc.constant(OPERATION_TYPES.TITLE), before: text, after: text }),
  fc.record({ type: fc.constant(OPERATION_TYPES.TODO_TEXT), todoId: id, before: text, after: text }),
  fc.record({ type: fc.constant(OPERATION_TYPES.TODO_TOGGLE), todoId: id, done: fc.boolean() }),
  fc.record({ type: fc.constant(OPERATION_TYPES.TODO_ADD), todo, index: fc.nat({ max: 20 }) }),
  fc.record({ type: fc.constant(OPERATION_TYPES.TODO_REMOVE), todo, index: fc.nat({ max: 20 }) })
)

const draft = fc.record({
  schemaVersion: fc.constant(DRAFT_SCHEMA_VERSION),
  noteId: fc.option(
    id.filter((value) => value !== 'new'),
    { nil: null }
  ),
  baseVersion: fc.integer({ min: 1, max: 1000 }),
  content: fc.record({ title: text, todos: fc.uniqueArray(todo, { selector: (item) => item.id, maxLength: 8 }) }),
  history: fc.record({
    undo: fc.array(operation, { maxLength: HISTORY_LIMIT / 2 }),
    redo: fc.array(operation, { maxLength: HISTORY_LIMIT / 2 })
  }),
  savedAt: fc.nat()
})

describe('Notes/draftSchemas', () => {
  it('should read back every draft when the write schema accepts it', () => {
    let accepted = 0

    fc.assert(
      fc.property(draft, (candidate) => {
        const body = { draft: { ...candidate, baseVersion: candidate.noteId === null ? null : candidate.baseVersion } }
        const parsed = putDraftSchema.safeParse(body)

        if (!parsed.success) {
          return
        }

        accepted++
        expect(readStoredDraft(JSON.parse(JSON.stringify(parsed.data.draft)))).toEqual(parsed.data.draft)
      })
    )

    expect(accepted).toBeGreaterThan(50)
  })
})
