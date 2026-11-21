import type { Untrusted } from '@shared/contract/types'
import { HTTP_METHODS } from '@shared/contract/http'
import { NOTES_PATHS } from '@shared/contract/notes/constants'
import type {
  NoteParams,
  DraftParams,
  Note,
  NotePage,
  Draft,
  CreateNote,
  UpdateNote,
  PutDraft
} from '@shared/contract/notes/types'
import { defineEndpoint } from '@shared/services/http'

export const NOTES_ENDPOINTS = {
  LIST: defineEndpoint<Untrusted<NotePage>>(HTTP_METHODS.GET, NOTES_PATHS.COLLECTION),
  GET: defineEndpoint<Untrusted<Note>, never, NoteParams>(HTTP_METHODS.GET, NOTES_PATHS.NOTE),
  CREATE: defineEndpoint<Untrusted<Note>, CreateNote>(HTTP_METHODS.POST, NOTES_PATHS.COLLECTION),
  UPDATE: defineEndpoint<Untrusted<Note>, UpdateNote, NoteParams>(HTTP_METHODS.PUT, NOTES_PATHS.NOTE),
  REMOVE: defineEndpoint<undefined, never, NoteParams>(HTTP_METHODS.DELETE, NOTES_PATHS.NOTE),
  DRAFT: defineEndpoint<Untrusted<Draft> | null, never, DraftParams>(HTTP_METHODS.GET, NOTES_PATHS.DRAFT),
  PUT_DRAFT: defineEndpoint<undefined, PutDraft, DraftParams>(HTTP_METHODS.PUT, NOTES_PATHS.DRAFT),
  REMOVE_DRAFT: defineEndpoint<undefined, never, DraftParams>(HTTP_METHODS.DELETE, NOTES_PATHS.DRAFT)
} as const
