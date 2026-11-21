import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import type { NoteId } from '@shared/contract/notes/ids'

const NOTES_PATH = '/notes'

export const NOTE_ROUTES = {
  NEW: `${NOTES_PATH}/${NEW_DRAFT_KEY}`,
  ITEM: (noteId: NoteId): string => `${NOTES_PATH}/${noteId}`
} as const
