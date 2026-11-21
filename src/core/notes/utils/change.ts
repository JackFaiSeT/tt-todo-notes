import { isRecord, isValueOf } from '@shared/contract/guards'
import { isEntityId, parseNoteId } from '@shared/contract/notes/ids'
import { CHANGE_TYPES } from '@notes/constants'
import type { NNotes } from '@notes/domain'

export const parseChange = (value: unknown): NNotes.Change | null => {
  if (!isRecord(value) || !isEntityId(value.id) || !isValueOf(CHANGE_TYPES, value.type)) {
    return null
  }

  return { type: value.type, id: parseNoteId(value.id) }
}
