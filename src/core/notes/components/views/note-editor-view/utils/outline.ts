import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import type { DraftKey } from '@shared/contract/notes/ids'
import type { NNotes } from '@notes/domain'
import { NOTE_EDITOR_SKELETON_ROWS } from '../constants'
import type { EditorOutline } from '../types'

export const toEditorOutline = (page: NNotes.Page | null | undefined, key: DraftKey): EditorOutline => {
  if (key === NEW_DRAFT_KEY) {
    return { rows: 0, isExisting: false }
  }

  const summary = page?.items.find((note) => note.id === key)

  return {
    rows: Math.min(summary?.total ?? NOTE_EDITOR_SKELETON_ROWS.DEFAULT, NOTE_EDITOR_SKELETON_ROWS.MAX),
    isExisting: true
  }
}
