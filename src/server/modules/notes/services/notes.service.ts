import type { IClock } from '#server/common/clock/types'
import type { Transactions } from '#server/database/transactions'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { normalize } from '@shared/contract/notes/content'
import { draftKeyOf } from '@shared/contract/notes/ids'
import type { DraftKey, NoteId } from '@shared/contract/notes/ids'
import type { CreateNote, Draft, Note, NotePage, PutDraft, UpdateNote } from '@shared/contract/notes/types'
import type { IDraftsRepository, INotesRepository, INotesService, INoteIdGenerator, ListNotesQuery } from '../types'
import { draftKeyMismatch, noteNotFound, versionConflict } from '../errors'

export class NotesService<TClient> implements INotesService {
  constructor(
    private readonly notesRepository: INotesRepository<TClient>,
    private readonly draftsRepository: IDraftsRepository<TClient>,
    private readonly transactions: Transactions<TClient>,
    private readonly clock: IClock,
    private readonly noteIdGenerator: INoteIdGenerator
  ) {}

  list(query: ListNotesQuery): NotePage {
    return this.transactions.read((client) => this.notesRepository.listSummaries(query, client))
  }

  get(id: NoteId): Note {
    return this.transactions.read((client) => this.requireNote(id, client))
  }

  private requireNote(id: NoteId, client: TClient): Note {
    const note = this.notesRepository.findNote(id, client)

    if (!note) {
      throw noteNotFound()
    }

    return note
  }

  create(input: CreateNote): Note {
    return this.transactions.runImmediate((client) => {
      const now = this.clock.now()
      const note = { ...normalize(input), id: this.noteIdGenerator.next(), createdAt: now, updatedAt: now, version: 1 }

      this.notesRepository.insertNote(note, client)

      if (!input.fromDeletedNote) {
        this.draftsRepository.remove(NEW_DRAFT_KEY, client)
      }

      return note
    })
  }

  update(id: NoteId, input: UpdateNote): Note {
    return this.transactions.runImmediate((client) => {
      const previous = this.requireNote(id, client)

      if ((input.force ? input.confirmedVersion : input.baseVersion) !== previous.version) {
        throw versionConflict()
      }

      const note = {
        ...previous,
        ...normalize(input),
        version: previous.version + 1,
        updatedAt: Math.max(this.clock.now(), previous.updatedAt + 1)
      }

      this.notesRepository.updateNote(note, client)
      this.draftsRepository.remove(id, client)

      return note
    })
  }

  remove(id: NoteId): void {
    this.transactions.runImmediate((client) => this.notesRepository.removeNote(id, client))
  }

  draft(key: DraftKey): Draft | null {
    return this.transactions.read((client) => this.draftsRepository.findDraft(key, client))
  }

  putDraft(key: DraftKey, { draft, observedVersion }: PutDraft): void {
    if (draftKeyOf(draft.noteId) !== key) {
      throw draftKeyMismatch()
    }

    this.transactions.runImmediate((client) => {
      if (key !== NEW_DRAFT_KEY) {
        const version = this.notesRepository.findVersion(key, client)

        if (version === undefined) {
          throw noteNotFound()
        }

        if (version !== draft.baseVersion && version !== observedVersion) {
          throw versionConflict()
        }
      }

      this.draftsRepository.save(key, draft, client)
    })
  }

  removeDraft(key: DraftKey): void {
    this.transactions.runImmediate((client) => this.draftsRepository.remove(key, client))
  }
}
