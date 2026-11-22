import { describe, expect, it, vi } from 'vitest'
import type { Transactions } from '#server/database/transactions'
import type { IDraftsRepository, INotesRepository } from '#server/modules/notes/types'
import { NotesService } from '#server/modules/notes/services/notes.service'
import { ERROR_CODES } from '@shared/contract/http'
import { parseNoteId } from '@shared/contract/notes/ids'
import { createContent, createNewDraft } from '../../../../../factories/notes'

const setup = () => {
  const id = parseNoteId('existing')
  const note = { ...createContent(), id, version: 2, createdAt: 10, updatedAt: 20 }

  const notesRepository: INotesRepository<null> = {
    findNote: vi.fn<INotesRepository<null>['findNote']>().mockReturnValue(note),
    listSummaries: vi.fn<INotesRepository<null>['listSummaries']>(),
    findVersion: vi.fn<INotesRepository<null>['findVersion']>().mockReturnValue(note.version),
    insertNote: vi.fn<INotesRepository<null>['insertNote']>(),
    updateNote: vi.fn<INotesRepository<null>['updateNote']>(),
    removeNote: vi.fn<INotesRepository<null>['removeNote']>()
  }

  const draftsRepository: IDraftsRepository<null> = {
    findDraft: vi.fn<IDraftsRepository<null>['findDraft']>(),
    save: vi.fn<IDraftsRepository<null>['save']>(),
    remove: vi.fn<IDraftsRepository<null>['remove']>()
  }

  const transactions: Transactions<null> = { read: (fn) => fn(null), runImmediate: (fn) => fn(null) }

  const service = new NotesService(
    notesRepository,
    draftsRepository,
    transactions,
    { now: () => 10 },
    { next: () => id }
  )

  return { id, note, service, notesRepository, draftsRepository }
}

describe('Notes/NotesService', () => {
  it('should reject a stale draft when the newer version has not been observed', () => {
    const { id, service, draftsRepository } = setup()

    expect(() => service.putDraft(id, { draft: { ...createNewDraft(), noteId: id, baseVersion: 1 } })).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.VERSION_CONFLICT })
    )

    expect(draftsRepository.save).not.toHaveBeenCalled()
  })

  it('should reject a draft when its parent has been deleted', () => {
    const { id, service, notesRepository } = setup()

    vi.mocked(notesRepository.findVersion).mockReturnValue(undefined)

    expect(() => service.putDraft(id, { draft: { ...createNewDraft(), noteId: id, baseVersion: 1 } })).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.NOTE_NOT_FOUND })
    )
  })

  it('should retain the editing base when the current version has been observed', () => {
    const { id, service, draftsRepository } = setup()
    const draft = { ...createNewDraft(), noteId: id, baseVersion: 1 }

    service.putDraft(id, { draft, observedVersion: 2 })
    expect(draftsRepository.save).toHaveBeenCalledWith(id, draft, null)
  })

  it('should identify the owner field when the draft and route disagree', () => {
    const { id, service } = setup()

    expect(() => service.putDraft(id, { draft: createNewDraft() })).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.VALIDATION_FAILED, details: { field: 'draft.noteId' } })
    )
  })

  it('should advance the timestamp when the clock moves backwards', () => {
    const { id, note, service } = setup()

    expect(service.update(id, { ...createContent(), baseVersion: note.version }).updatedAt).toBe(note.updatedAt + 1)
  })
})
