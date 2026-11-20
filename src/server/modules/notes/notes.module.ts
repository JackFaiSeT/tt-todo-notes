import { SystemClock } from '#server/common/clock'
import type { NotesDatabase } from '#server/database/connection'
import { createTransactions } from '#server/database/transactions'
import type { INotesService } from './types'
import { DraftsRepository } from './repositories/drafts.repository'
import { NotesRepository } from './repositories/notes.repository'
import { NoteIdGenerator } from './providers/note-id-generator'
import { NotesService } from './services/notes.service'

export const createNotesModule = (database: NotesDatabase): INotesService =>
  new NotesService(
    new NotesRepository(),
    new DraftsRepository(),
    createTransactions(database),
    new SystemClock(),
    new NoteIdGenerator()
  )
