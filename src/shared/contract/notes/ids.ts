import type { EntityId } from '@shared/contract/types'
import { NEW_DRAFT_KEY } from './constants'

export type NoteId = EntityId<'NoteId'>

export type TodoId = EntityId<'TodoId'>

export type DraftKey = NoteId | typeof NEW_DRAFT_KEY

export const isEntityId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/u.test(value)

const parseEntityId = <TId extends NoteId | TodoId>(value: unknown): TId => {
  if (!isEntityId(value)) {
    throw new TypeError('Некорректный идентификатор.')
  }

  return value as TId
}

export const parseNoteId = (value: unknown): NoteId => parseEntityId<NoteId>(value)

export const parseTodoId = (value: unknown): TodoId => parseEntityId<TodoId>(value)

export const parseDraftKey = (value: unknown): DraftKey =>
  value === NEW_DRAFT_KEY ? NEW_DRAFT_KEY : parseNoteId(value)

export const draftKeyOf = (noteId: NoteId | null): DraftKey => noteId ?? NEW_DRAFT_KEY
