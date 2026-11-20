import type { NoteId, DraftKey } from '@shared/contract/notes/ids'
import type { CreateNote, UpdateNote, PutDraft, Draft, Note, NotePage } from '@shared/contract/notes/types'

export type NoteCursor = {
  updatedAt: number
  id: NoteId
}

export type ListNotesQuery = {
  limit: number
  cursor?: NoteCursor | undefined
  search?: string | undefined
}

export interface INotesService {
  list(query: ListNotesQuery): NotePage
  get(id: NoteId): Note
  create(input: CreateNote): Note
  update(id: NoteId, input: UpdateNote): Note
  remove(id: NoteId): void
  draft(key: DraftKey): Draft | null
  putDraft(key: DraftKey, input: PutDraft): void
  removeDraft(key: DraftKey): void
}

export interface INotesRepository<TClient> {
  listSummaries(query: ListNotesQuery, client: TClient): NotePage
  findNote(id: NoteId, client: TClient): Note | undefined
  findVersion(id: NoteId, client: TClient): number | undefined
  insertNote(note: Note, client: TClient): void
  updateNote(note: Note, client: TClient): void
  removeNote(id: NoteId, client: TClient): void
}

export interface IDraftsRepository<TClient> {
  findDraft(key: DraftKey, client: TClient): Draft | null
  save(key: DraftKey, draft: Draft, client: TClient): void
  remove(key: DraftKey, client: TClient): void
}

export interface INoteIdGenerator {
  next(): NoteId
}
