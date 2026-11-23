import { describe, expect, it } from 'vitest'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import type { NNotes } from '@notes/domain'
import { DRAFT_OFFER_DIALOG } from '@notes/components/views/note-editor-view/constants/dialogs'
import { toDraftOfferDialog } from '@notes/components/views/note-editor-view/utils/draft-offer'

const key = parseNoteId('note')

const draft: NNotes.Draft = {
  noteId: key,
  baseVersion: 1,
  content: { title: 'Черновик', todos: [] },
  history: { undo: [], redo: [] },
  savedAt: Date.UTC(2026, 10, 20, 9, 5)
}

const recovery: NNotes.DraftRecovery = { key, baseVersion: 1, hasConflict: false }

describe('Notes/toDraftOfferDialog', () => {
  it('should offer a plain restore and explain the single draft rule when the draft matches the saved note', () => {
    const dialog = toDraftOfferDialog({ draft, recovery }, { key, isDirty: false })

    expect(dialog.acceptText).toBe(DRAFT_OFFER_DIALOG.ACCEPT)
    expect(dialog.description).toContain(DRAFT_OFFER_DIALOG.RULES.trim())
    expect(dialog.description).not.toContain(DRAFT_OFFER_DIALOG.DETAILS_CONFLICT.trim())
    expect(dialog.description).not.toContain(DRAFT_OFFER_DIALOG.DETAILS_REPLACE.trim())
  })

  it('should warn about a newer saved version when the draft is stale', () => {
    const dialog = toDraftOfferDialog({ draft, recovery: { ...recovery, hasConflict: true } }, { key, isDirty: false })

    expect(dialog.description).toContain(DRAFT_OFFER_DIALOG.DETAILS_CONFLICT.trim())
  })

  it('should warn that current edits will be replaced when the working copy is dirty', () => {
    const dialog = toDraftOfferDialog({ draft, recovery }, { key, isDirty: true })

    expect(dialog.description).toContain(DRAFT_OFFER_DIALOG.DETAILS_REPLACE.trim())
  })

  it('should offer a new note when the original one was deleted', () => {
    const copy: NNotes.DraftRecovery = { key: NEW_DRAFT_KEY, baseVersion: null, hasConflict: false }
    const dialog = toDraftOfferDialog({ draft, recovery: copy }, { key, isDirty: false })

    expect(dialog.description).toContain(DRAFT_OFFER_DIALOG.DETAILS_COPY.trim())
    expect(dialog.acceptText).toBe(DRAFT_OFFER_DIALOG.ACCEPT_COPY)
  })
})
