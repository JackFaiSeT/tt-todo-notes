import { createId } from '@shared/contract/create-id'
import { parseNoteId } from '@shared/contract/notes/ids'
import type { NoteId } from '@shared/contract/notes/ids'
import type { INoteIdGenerator } from '../types'

export class NoteIdGenerator implements INoteIdGenerator {
  next(): NoteId {
    return parseNoteId(createId())
  }
}
