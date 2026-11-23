import { describe, expect, it } from 'vitest'
import { ERROR_CODES, HTTP_STATUS } from '@shared/contract/http'
import { NEW_DRAFT_KEY, DRAFT_SCHEMA_VERSION } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import { HTTP_ERROR_KINDS } from '@shared/constants/http'
import { HttpError } from '@shared/services/http'
import { CHANGE_TYPES, DRAFT_OUTCOMES, SAVE_OUTCOMES } from '@notes/constants'
import type { INotesApi } from '@notes/api'
import { NotesAdapter, NotesService } from '@notes/composition'
import { createNotesChannel } from '../../../factories/editor-session'
import { createTitleOnlyContent, createNewDraft } from '../../../factories/notes'
import { fakeNotesApi } from '../../../factories/notes-api'
import { createDraftStorage } from '../../../factories/storage'

describe('Notes/NotesService', () => {
  it('should propagate the original failure when a draft write loses its connection', async () => {
    const api = fakeNotesApi()
    const adapter = new NotesAdapter()

    const service = new NotesService({
      notesApi: api,
      notesAdapter: adapter,
      channelClient: createNotesChannel(),
      ...createDraftStorage()
    })

    const error = new Error('connection lost')
    const key = parseNoteId('existing')

    api.putDraft.mockRejectedValueOnce(error)

    await expect(
      service.saveDraft({ key, draft: adapter.toDraft({ ...createNewDraft(), noteId: key, baseVersion: 1 }) })
    ).rejects.toBe(error)

    expect(api.get).not.toHaveBeenCalled()
  })

  it('should report deletion when the note disappears during conflict recovery', async () => {
    const api = fakeNotesApi()
    const adapter = new NotesAdapter()

    const service = new NotesService({
      notesApi: api,
      notesAdapter: adapter,
      channelClient: createNotesChannel(),
      ...createDraftStorage()
    })

    const key = parseNoteId('deleted')

    api.putDraft.mockRejectedValueOnce(
      new HttpError({
        kind: HTTP_ERROR_KINDS.RESPONSE,
        status: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.VERSION_CONFLICT
      })
    )

    const draft = adapter.toDraft({ ...createNewDraft(), noteId: key, baseVersion: 1 })

    expect(await service.saveDraft({ key, draft })).toEqual({ kind: DRAFT_OUTCOMES.DELETED })
    expect(api.get).toHaveBeenCalledExactlyOnceWith(key, undefined)
  })

  it('should return null when the note is missing', async () => {
    const service = new NotesService({
      notesApi: fakeNotesApi(),
      notesAdapter: new NotesAdapter(),
      channelClient: createNotesChannel(),
      ...createDraftStorage()
    })

    expect(await service.get(parseNoteId('absent'))).toBeNull()
  })

  it('should propagate the error when the API route is missing', async () => {
    const api = fakeNotesApi()

    api.get.mockRejectedValue(
      new HttpError({
        kind: HTTP_ERROR_KINDS.RESPONSE,
        status: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.ROUTE_NOT_FOUND
      })
    )

    await expect(
      new NotesService({
        notesApi: api,
        notesAdapter: new NotesAdapter(),
        channelClient: createNotesChannel(),
        ...createDraftStorage()
      }).get(parseNoteId('note'))
    ).rejects.toMatchObject({
      code: ERROR_CODES.ROUTE_NOT_FOUND
    })
  })

  it('should report a draft error when its history is missing', async () => {
    const api: INotesApi = { ...fakeNotesApi(), draft: async () => ({ schemaVersion: DRAFT_SCHEMA_VERSION }) }

    await expect(
      new NotesService({
        notesApi: api,
        notesAdapter: new NotesAdapter(),
        channelClient: createNotesChannel(),
        ...createDraftStorage()
      }).draft(NEW_DRAFT_KEY)
    ).rejects.toMatchObject({
      code: ERROR_CODES.DRAFT_UNREADABLE
    })
  })

  it('should notify other tabs when deletion succeeds', async () => {
    const api = fakeNotesApi()
    const channel = createNotesChannel()

    const service = new NotesService({
      notesApi: api,
      notesAdapter: new NotesAdapter(),
      channelClient: channel,
      ...createDraftStorage()
    })

    const note = await api.create(createTitleOnlyContent('Заметка'))

    await service.remove(note.id)

    expect(channel.publish).toHaveBeenCalledExactlyOnceWith({ type: CHANGE_TYPES.DELETED, id: note.id })
  })

  it('should require confirmation before writing when a newer version is already known', async () => {
    const api = fakeNotesApi()

    const service = new NotesService({
      notesApi: api,
      notesAdapter: new NotesAdapter(),
      channelClient: createNotesChannel(),
      ...createDraftStorage()
    })

    const note = await api.create(createTitleOnlyContent('Исходная'))
    const result = await service.save({ key: note.id, baseVersion: 1, observedVersion: 2, content: note })

    expect(result).toEqual({ kind: SAVE_OUTCOMES.CONFLICT, latestVersion: 2 })
    expect(api.update).not.toHaveBeenCalled()
  })

  it.each([
    { observedVersion: 1, shouldRetry: true },
    { observedVersion: 2, shouldRetry: false },
    { observedVersion: 3, shouldRetry: false }
  ])(
    'should return shouldRetry=$shouldRetry when a rejected draft observed version $observedVersion',
    async ({ observedVersion, shouldRetry }) => {
      const api = fakeNotesApi()
      const adapter = new NotesAdapter()

      const service = new NotesService({
        notesApi: api,
        notesAdapter: adapter,
        channelClient: createNotesChannel(),
        ...createDraftStorage()
      })

      const note = await api.create(createTitleOnlyContent('Версия'))

      await api.update(note.id, { title: 'Вторая', todos: [], baseVersion: 1 })

      api.putDraft.mockRejectedValueOnce(
        new HttpError({
          kind: HTTP_ERROR_KINDS.RESPONSE,
          status: HTTP_STATUS.CONFLICT,
          code: ERROR_CODES.VERSION_CONFLICT
        })
      )

      const draft = adapter.toDraft({ ...createNewDraft(), noteId: note.id, baseVersion: 1 })

      expect(await service.saveDraft({ key: note.id, draft, observedVersion })).toMatchObject({
        kind: DRAFT_OUTCOMES.CONFLICT,
        latest: { id: note.id, version: 2 },
        shouldRetry
      })
    }
  )

  it('should copy the tab draft to the device when the tab hides and forget it when the note is saved', async () => {
    const api = fakeNotesApi()
    const adapter = new NotesAdapter()
    const storage = createDraftStorage()

    const service = new NotesService({
      notesApi: api,
      notesAdapter: adapter,
      channelClient: createNotesChannel(),
      ...storage
    })

    const draft = adapter.toDraft(createNewDraft())

    service.handOffDraft(NEW_DRAFT_KEY)
    expect(service.readHandedOffDraft(NEW_DRAFT_KEY)).toBeNull()

    service.keepLocalDraft(NEW_DRAFT_KEY, draft)
    service.handOffDraft(NEW_DRAFT_KEY)
    expect(service.readHandedOffDraft(NEW_DRAFT_KEY)?.content).toEqual(draft.content)

    await service.save({ key: NEW_DRAFT_KEY, content: draft.content, baseVersion: null })
    expect(service.readLocalDraft(NEW_DRAFT_KEY)).toBeNull()
    expect(service.readHandedOffDraft(NEW_DRAFT_KEY)).toBeNull()
  })
})
