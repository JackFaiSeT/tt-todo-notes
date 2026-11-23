import { ERROR_CODES } from '@shared/contract/http'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { normalize } from '@shared/contract/notes/content'
import type { NoteId, DraftKey } from '@shared/contract/notes/ids'
import type { IChannelClient, Unsubscribe } from '@shared/services/channel'
import type { ReadOptions } from '@shared/services/http'
import type { IStorageClient } from '@shared/services/storage'
import { CHANGE_TYPES, DRAFT_OUTCOMES, NOTES_CONTRACT_VIOLATIONS, NOTES_STORAGE_KEYS, SAVE_OUTCOMES } from './constants'
import { toDraftRecovery } from './utils/draft-recovery'
import { withNotesErrors } from './utils/request'
import { hasVersionConflict } from './utils/version'
import type { NNotes } from './domain'
import type { NNotesDataContracts } from './domain/data-contracts'
import type { INotesAdapter } from './adapter'
import type { INotesApi, PageRequest } from './api'
import { hasNotesErrorCode, NotesError } from './errors'

export type NotesServiceDependencies = {
  notesApi: INotesApi
  notesAdapter: INotesAdapter
  channelClient: IChannelClient<NNotes.Change>
  tabStorageClient: IStorageClient
  deviceStorageClient: IStorageClient
}

export interface INotesService {
  list(options?: PageRequest): Promise<NNotes.Page>
  get(id: NoteId, options?: ReadOptions): Promise<NNotes.Model | null>
  save(request: NNotes.SaveRequest): Promise<NNotes.SaveResult>
  remove(id: NoteId): Promise<void>
  draft(key: DraftKey, options?: ReadOptions): Promise<NNotes.Draft | null>
  planDraftRecovery(request: NNotes.RecoveryRequest): NNotes.DraftRecovery
  saveDraft(request: NNotes.DraftWriteRequest): Promise<NNotes.DraftResult>
  removeDraft(key: DraftKey): Promise<void>
  readLocalDraft(key: DraftKey): NNotes.Draft | null
  keepLocalDraft(key: DraftKey, draft: NNotes.Draft | null): void
  readHandedOffDraft(key: DraftKey): NNotes.Draft | null
  handOffDraft(key: DraftKey): void
  forgetHandedOffDraft(key: DraftKey): void
  subscribe(handle: NNotes.ChangeHandler): Unsubscribe
}

export class NotesService implements INotesService {
  private readonly notesApi: INotesApi

  private readonly notesAdapter: INotesAdapter

  private readonly channelClient: IChannelClient<NNotes.Change>

  private readonly tabStorageClient: IStorageClient

  private readonly deviceStorageClient: IStorageClient

  constructor(notesServiceDependencies: NotesServiceDependencies) {
    this.notesApi = notesServiceDependencies.notesApi
    this.notesAdapter = notesServiceDependencies.notesAdapter
    this.channelClient = notesServiceDependencies.channelClient
    this.tabStorageClient = notesServiceDependencies.tabStorageClient
    this.deviceStorageClient = notesServiceDependencies.deviceStorageClient
  }

  async list(options?: PageRequest): Promise<NNotes.Page> {
    return this.notesAdapter.toPage(await withNotesErrors(() => this.notesApi.list(options)))
  }

  async get(id: NoteId, options?: ReadOptions): Promise<NNotes.Model | null> {
    try {
      return this.notesAdapter.toModel(await withNotesErrors(() => this.notesApi.get(id, options)))
    } catch (error) {
      if (hasNotesErrorCode(error, ERROR_CODES.NOTE_NOT_FOUND)) {
        return null
      }

      throw error
    }
  }

  async save(request: NNotes.SaveRequest): Promise<NNotes.SaveResult> {
    const result = await this.persist(request)

    if (result.kind === SAVE_OUTCOMES.SAVED) {
      this.keepLocalDraft(request.key, null)
    }

    return result
  }

  private async persist(request: NNotes.SaveRequest): Promise<NNotes.SaveResult> {
    const { key, baseVersion, observedVersion, hasRejectedVersion = false, isCopy = false, isForced = false } = request
    const content = normalize(request.content)

    if (key === NEW_DRAFT_KEY || isCopy) {
      const body = this.notesAdapter.toCreateBody(content, { isCopy })

      return this.publishSaved(await withNotesErrors(() => this.notesApi.create(body)))
    }

    if (baseVersion === null) {
      throw new TypeError(NOTES_CONTRACT_VIOLATIONS.BASE_VERSION)
    }

    if (!isForced && (hasRejectedVersion || hasVersionConflict(baseVersion, observedVersion))) {
      return { kind: SAVE_OUTCOMES.CONFLICT, latestVersion: observedVersion }
    }

    const body = this.notesAdapter.toUpdateBody(content, { baseVersion, isForced, confirmedVersion: observedVersion })

    try {
      return this.publishSaved(await withNotesErrors(() => this.notesApi.update(key, body)))
    } catch (error) {
      if (hasNotesErrorCode(error, ERROR_CODES.VERSION_CONFLICT)) {
        return this.toSaveConflict(key)
      }

      if (hasNotesErrorCode(error, ERROR_CODES.NOTE_NOT_FOUND)) {
        return { kind: SAVE_OUTCOMES.DELETED }
      }

      throw error
    }
  }

  async remove(id: NoteId): Promise<void> {
    await withNotesErrors(() => this.notesApi.remove(id))
    this.keepLocalDraft(id, null)
    this.channelClient.publish({ type: CHANGE_TYPES.DELETED, id })
  }

  async draft(key: DraftKey, options?: ReadOptions): Promise<NNotes.Draft | null> {
    const data = await withNotesErrors(() => this.notesApi.draft(key, options))

    if (data === null) {
      return null
    }

    try {
      return this.notesAdapter.toDraft(data)
    } catch (cause) {
      throw new NotesError(ERROR_CODES.DRAFT_UNREADABLE, cause)
    }
  }

  planDraftRecovery(request: NNotes.RecoveryRequest): NNotes.DraftRecovery {
    return toDraftRecovery(request)
  }

  async saveDraft(request: NNotes.DraftWriteRequest): Promise<NNotes.DraftResult> {
    try {
      await this.writeDraft(request)

      return { kind: DRAFT_OUTCOMES.WRITTEN }
    } catch (error) {
      if (hasNotesErrorCode(error, ERROR_CODES.NOTE_NOT_FOUND)) {
        return { kind: DRAFT_OUTCOMES.DELETED }
      }

      if (!hasNotesErrorCode(error, ERROR_CODES.VERSION_CONFLICT) || request.key === NEW_DRAFT_KEY) {
        throw error
      }

      return this.resolveDraftConflict(request.key, request.observedVersion)
    }
  }

  async removeDraft(key: DraftKey): Promise<void> {
    await withNotesErrors(() => this.notesApi.removeDraft({ key }))
    this.keepLocalDraft(key, null)
  }

  readLocalDraft(key: DraftKey): NNotes.Draft | null {
    return this.readStoredDraft(this.tabStorageClient, key)
  }

  keepLocalDraft(key: DraftKey, draft: NNotes.Draft | null): void {
    if (draft) {
      this.tabStorageClient.write(NOTES_STORAGE_KEYS.draft(key), this.notesAdapter.toDraftBody(draft).draft)

      return
    }

    this.tabStorageClient.remove(NOTES_STORAGE_KEYS.draft(key))
    this.forgetHandedOffDraft(key)
  }

  readHandedOffDraft(key: DraftKey): NNotes.Draft | null {
    return this.readStoredDraft(this.deviceStorageClient, key)
  }

  handOffDraft(key: DraftKey): void {
    const draft = this.readLocalDraft(key)

    if (draft) {
      this.deviceStorageClient.write(NOTES_STORAGE_KEYS.draft(key), this.notesAdapter.toDraftBody(draft).draft)
    }
  }

  forgetHandedOffDraft(key: DraftKey): void {
    this.deviceStorageClient.remove(NOTES_STORAGE_KEYS.draft(key))
  }

  private readStoredDraft(storageClient: IStorageClient, key: DraftKey): NNotes.Draft | null {
    return storageClient.read(NOTES_STORAGE_KEYS.draft(key), (value) => this.notesAdapter.toStoredDraft(value))
  }

  subscribe(handle: NNotes.ChangeHandler): Unsubscribe {
    return this.channelClient.subscribe(handle)
  }

  private publishSaved(data: NNotesDataContracts.GetNoteItemData): NNotes.SavedResult {
    const note = this.notesAdapter.toModel(data)

    this.channelClient.publish({ type: CHANGE_TYPES.SAVED, id: note.id })

    return { kind: SAVE_OUTCOMES.SAVED, note }
  }

  private async writeDraft({
    key,
    draft,
    observedVersion,
    keepalive = false
  }: NNotes.DraftWriteRequest): Promise<void> {
    if (!draft) {
      await withNotesErrors(() => this.notesApi.removeDraft({ key, keepalive }))

      return
    }

    const body = this.notesAdapter.toDraftBody(draft, observedVersion)

    await withNotesErrors(() => this.notesApi.putDraft(key, { body, keepalive }))
  }

  private async toSaveConflict(id: NoteId): Promise<NNotes.SaveResult> {
    const latest = await this.get(id)

    return latest ? { kind: SAVE_OUTCOMES.CONFLICT, latestVersion: latest.version } : { kind: SAVE_OUTCOMES.DELETED }
  }

  private async resolveDraftConflict(id: NoteId, observedVersion: number | undefined): Promise<NNotes.DraftResult> {
    const latest = await this.get(id)

    if (!latest) {
      return { kind: DRAFT_OUTCOMES.DELETED }
    }

    return { kind: DRAFT_OUTCOMES.CONFLICT, latest, shouldRetry: latest.version > (observedVersion ?? 0) }
  }
}
