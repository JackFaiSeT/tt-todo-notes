import { describe, expect, it } from 'vitest'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import { toDraftRecovery, toHandedOffDraft, toUnsyncedDraft } from '@notes/utils/draft-recovery'
import type { NNotes } from '@notes/domain'

const key = parseNoteId('note')

const toDraft = (baseVersion: number | null): NNotes.Draft => ({
  noteId: baseVersion === null ? null : key,
  baseVersion,
  content: { title: 'Черновик', todos: [] },
  history: { undo: [], redo: [] },
  savedAt: 1
})

describe('Notes/toDraftRecovery', () => {
  it('should restore the draft as a new note when the saved note is gone', () => {
    expect(toDraftRecovery({ key, currentVersion: null, draft: toDraft(1) })).toEqual({
      key: NEW_DRAFT_KEY,
      baseVersion: null,
      hasConflict: false
    })
  })

  it.each([
    { currentVersion: 1, hasConflict: false },
    { currentVersion: 2, hasConflict: true }
  ])(
    'should report hasConflict=$hasConflict when the note is at version $currentVersion',
    ({ currentVersion, hasConflict }) => {
      expect(toDraftRecovery({ key, currentVersion, draft: toDraft(1) })).toEqual({
        key,
        baseVersion: 1,
        hasConflict
      })
    }
  )

  it('should keep a new draft without conflict when nothing was saved yet', () => {
    expect(toDraftRecovery({ key: NEW_DRAFT_KEY, currentVersion: null, draft: toDraft(null) })).toEqual({
      key: NEW_DRAFT_KEY,
      baseVersion: null,
      hasConflict: false
    })
  })

  it.each([
    { name: 'only this tab kept a copy', remote: null, local: 'Вкладка', expected: 'Вкладка' },
    { name: 'the server copy differs', remote: 'Сервер', local: 'Вкладка', expected: 'Вкладка' },
    { name: 'both copies match', remote: 'Вкладка', local: 'Вкладка', expected: null },
    { name: 'this tab kept no copy', remote: 'Сервер', local: null, expected: null }
  ])('should offer the tab copy only when $name', ({ remote, local, expected }) => {
    const toTitled = (title: string | null): NNotes.Draft | null =>
      title === null ? null : { ...toDraft(1), content: { title, todos: [] } }

    expect(toUnsyncedDraft(toTitled(remote), toTitled(local))?.content.title ?? null).toBe(expected)
  })

  it.each([
    { name: 'the server has no draft', remote: null, handedOff: ['Закрытая', 5], expected: 'Закрытая' },
    {
      name: 'the closed tab wrote later edits',
      remote: ['Сервер', 3],
      handedOff: ['Закрытая', 5],
      expected: 'Закрытая'
    },
    { name: 'the server draft is newer', remote: ['Другая', 7], handedOff: ['Закрытая', 5], expected: null },
    { name: 'the server received the same edits', remote: ['Закрытая', 3], handedOff: ['Закрытая', 5], expected: null }
  ] satisfies {
    name: string
    remote: [string, number] | null
    handedOff: [string, number]
    expected: string | null
  }[])('should offer the copy of a closed tab only when $name', ({ remote, handedOff, expected }) => {
    const toSaved = ([title, savedAt]: [string, number]): NNotes.Draft => ({
      ...toDraft(1),
      content: { title, todos: [] },
      savedAt
    })

    expect(toHandedOffDraft(remote && toSaved(remote), toSaved(handedOff))?.content.title ?? null).toBe(expected)
  })
})
