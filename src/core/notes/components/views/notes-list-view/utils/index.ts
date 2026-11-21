import { NOTE_SEARCH_MAX } from '@shared/contract/notes/constants'
import { toPlainText } from '@shared/contract/notes/content'
import type { NoteId } from '@shared/contract/notes/ids'
import type { DialogOptions } from '@shared/stores/types'
import { NOTE_TEXTS } from '@notes/constants'
import type { NNotes } from '@notes/domain'
import { NOTE_CELL_ATTRIBUTE, NOTE_REMOVAL_DIALOG } from '../constants'

export const toSearchText = (value: unknown): string => {
  const text = Array.isArray(value) ? value[0] : value

  return typeof text === 'string' ? toPlainText(text).trim().slice(0, NOTE_SEARCH_MAX) : ''
}

export const toRemovalDialog = (note: NNotes.Summary): DialogOptions => ({
  title: NOTE_REMOVAL_DIALOG.TITLE,
  description: NOTE_REMOVAL_DIALOG.DESCRIPTION(note.title || NOTE_TEXTS.UNTITLED),
  acceptText: NOTE_REMOVAL_DIALOG.ACCEPT,
  declineText: NOTE_REMOVAL_DIALOG.DECLINE,
  isDanger: true
})

export const toNeighborIds = (notes: NNotes.Summary[], id: NoteId): NoteId[] => {
  const index = notes.findIndex((note) => note.id === id)

  return [notes[index + 1]?.id, notes[index - 1]?.id].filter((neighbor): neighbor is NoteId => neighbor !== undefined)
}

export const toNoteLinkSelector = (id: NoteId): string => `[${NOTE_CELL_ATTRIBUTE}="${CSS.escape(id)}"] a`
