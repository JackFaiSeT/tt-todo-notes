import type { NoteId, DraftKey } from '@shared/contract/notes/ids'
import type { IHttpClient, ReadOptions } from '@shared/services/http'
import type { NNotesDataContracts } from './domain/data-contracts'
import { NOTES_ENDPOINTS } from './configs'

export type PageRequest = ReadOptions & NNotesDataContracts.GetNotesListRequestParams

export type DraftWrite = {
  body: NNotesDataContracts.PutDraftRequestBody
  keepalive?: boolean
}

export type DraftRemoval = {
  key: DraftKey
  keepalive?: boolean
}

export interface INotesApi {
  list(options?: PageRequest): Promise<NNotesDataContracts.GetNotesListData>
  get(id: NoteId, options?: ReadOptions): Promise<NNotesDataContracts.GetNoteItemData>
  create(body: NNotesDataContracts.PostNoteRequestBody): Promise<NNotesDataContracts.GetNoteItemData>
  update(id: NoteId, body: NNotesDataContracts.PutNoteRequestBody): Promise<NNotesDataContracts.GetNoteItemData>
  remove(id: NoteId): Promise<void>
  draft(key: DraftKey, options?: ReadOptions): Promise<NNotesDataContracts.GetDraftData | null>
  putDraft(key: DraftKey, options: DraftWrite): Promise<void>
  removeDraft(options: DraftRemoval): Promise<void>
}

export class NotesApi implements INotesApi {
  constructor(private readonly httpClient: IHttpClient) {}

  list({ cursor, limit, q, signal }: PageRequest = {}): Promise<NNotesDataContracts.GetNotesListData> {
    return this.httpClient.request(NOTES_ENDPOINTS.LIST, {
      query: { ...(cursor && { cursor }), ...(limit !== undefined && { limit }), ...(q && { q }) },
      signal
    })
  }

  get(id: NoteId, options?: ReadOptions): Promise<NNotesDataContracts.GetNoteItemData> {
    return this.httpClient.request(NOTES_ENDPOINTS.GET, { ...options, params: { id } })
  }

  create(body: NNotesDataContracts.PostNoteRequestBody): Promise<NNotesDataContracts.GetNoteItemData> {
    return this.httpClient.request(NOTES_ENDPOINTS.CREATE, { body })
  }

  update(id: NoteId, body: NNotesDataContracts.PutNoteRequestBody): Promise<NNotesDataContracts.GetNoteItemData> {
    return this.httpClient.request(NOTES_ENDPOINTS.UPDATE, { params: { id }, body })
  }

  remove(id: NoteId): Promise<void> {
    return this.httpClient.request(NOTES_ENDPOINTS.REMOVE, { params: { id } })
  }

  draft(key: DraftKey, options?: ReadOptions): Promise<NNotesDataContracts.GetDraftData | null> {
    return this.httpClient.request(NOTES_ENDPOINTS.DRAFT, { ...options, params: { key } })
  }

  putDraft(key: DraftKey, options: DraftWrite): Promise<void> {
    return this.httpClient.request(NOTES_ENDPOINTS.PUT_DRAFT, { params: { key }, ...options })
  }

  removeDraft({ key, keepalive = false }: DraftRemoval): Promise<void> {
    return this.httpClient.request(NOTES_ENDPOINTS.REMOVE_DRAFT, { params: { key }, keepalive })
  }
}
