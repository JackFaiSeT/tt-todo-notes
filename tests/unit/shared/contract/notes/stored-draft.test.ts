import { describe, expect, it } from 'vitest'
import { OPERATION_TYPES, TITLE_LIMIT } from '@shared/contract/notes/constants'
import { readStoredDraft } from '@shared/contract/notes/stored-draft'
import type { Operation } from '@shared/contract/notes/types'
import { createNewDraft } from '../../../../factories/notes'

const titleStep: Operation = { type: OPERATION_TYPES.TITLE, before: '', after: 'План' }

const withHistory = (undo: number, redo: number) => ({
  ...createNewDraft(),
  history: { undo: Array.from({ length: undo }, () => titleStep), redo: Array.from({ length: redo }, () => titleStep) }
})

describe('Contract/readStoredDraft', () => {
  it('should read a stored draft when it matches the current format', () => {
    const draft = withHistory(1, 1)

    expect(readStoredDraft(JSON.parse(JSON.stringify(draft)))).toEqual(draft)
  })

  it.each([
    { undo: 50, redo: 0 },
    { undo: 25, redo: 25 }
  ])('should accept the history when it holds $undo undo and $redo redo steps', ({ undo, redo }) => {
    expect(readStoredDraft(withHistory(undo, redo)).history.undo).toHaveLength(undo)
  })

  it.each([
    { name: 'the history exceeds fifty steps', draft: withHistory(26, 25) },
    {
      name: 'an item id repeats',
      draft: {
        ...createNewDraft(),
        content: { title: '', todos: [0, 1].map(() => ({ id: 'a', text: 'x', done: false })) }
      }
    },
    {
      name: 'the title is too long',
      draft: { ...createNewDraft(), content: { title: 'я'.repeat(TITLE_LIMIT + 1), todos: [] } }
    },
    { name: 'the schema version is unknown', draft: { ...createNewDraft(), schemaVersion: 2 } },
    { name: 'a new draft names a note version', draft: { ...createNewDraft(), baseVersion: 1 } },
    {
      name: 'an operation carries an extra field',
      draft: { ...withHistory(0, 0), history: { undo: [{ ...titleStep, extra: 1 }], redo: [] } }
    }
  ])('should reject the stored draft when $name', ({ draft }) => {
    expect(() => readStoredDraft(draft)).toThrow(TypeError)
  })
})
