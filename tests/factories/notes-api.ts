import { vi } from 'vitest'
import { HTTP_STATUS, ERROR_CODES } from '@shared/contract/http'
import { NEW_DRAFT_KEY, NOTE_PREVIEW_TODOS_MAX } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import type { DraftKey } from '@shared/contract/notes/ids'
import type { Note, Draft, CreateNote, UpdateNote } from '@shared/contract/notes/types'
import { HTTP_ERROR_KINDS } from '@shared/constants/http'
import { HttpError } from '@shared/services/http'
import type { INotesApi, DraftWrite, DraftRemoval } from '@notes/api'

export const fakeNotesApi = () => {
  const records = new Map<string, Note>()
  const drafts = new Map<string, Draft>()
  let sequence = 0

  const get = (id: string) => {
    const note = records.get(id)

    if (!note) {
      throw new HttpError({
        kind: HTTP_ERROR_KINDS.RESPONSE,
        status: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.NOTE_NOT_FOUND
      })
    }

    return note
  }

  const api = {
    list: vi.fn<INotesApi['list']>(async () => ({
      nextCursor: null,
      count: records.size,
      items: [...records.values()]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((note) => ({
          ...note,
          total: note.todos.length,
          completed: note.todos.filter((todo) => todo.done).length,
          preview: note.todos.slice(0, NOTE_PREVIEW_TODOS_MAX)
        }))
    })),
    get: vi.fn<(...args: Parameters<INotesApi['get']>) => Promise<Note>>(async (id: string) => get(id)),
    create: vi.fn<(...args: Parameters<INotesApi['create']>) => Promise<Note>>(async (data: CreateNote) => {
      const note = {
        title: data.title,
        todos: data.todos,
        id: parseNoteId(String(++sequence)),
        version: 1,
        createdAt: sequence,
        updatedAt: sequence
      }

      records.set(note.id, note)

      if (!data.fromDeletedNote) {
        drafts.delete(NEW_DRAFT_KEY)
      }

      return note
    }),
    update: vi.fn<(...args: Parameters<INotesApi['update']>) => Promise<Note>>(async (id: string, data: UpdateNote) => {
      const note = get(id)

      if (note.version !== (data.force ? data.confirmedVersion : data.baseVersion)) {
        throw new HttpError({
          kind: HTTP_ERROR_KINDS.RESPONSE,
          status: HTTP_STATUS.CONFLICT,
          code: ERROR_CODES.VERSION_CONFLICT
        })
      }

      const next = {
        ...note,
        title: data.title,
        todos: data.todos,
        updatedAt: ++sequence,
        version: note.version + 1
      }

      records.set(id, next)
      drafts.delete(id)

      return next
    }),
    remove: vi.fn<INotesApi['remove']>(async (id: string) => {
      records.delete(id)
      drafts.delete(id)
    }),
    draft: vi.fn<(...args: Parameters<INotesApi['draft']>) => Promise<Draft | null>>(
      async (key: string) => drafts.get(key) ?? null
    ),
    putDraft: vi.fn<INotesApi['putDraft']>(async (key: DraftKey, options: DraftWrite) => {
      drafts.set(key, options.body.draft)
    }),
    removeDraft: vi.fn<INotesApi['removeDraft']>(async ({ key }: DraftRemoval) => {
      drafts.delete(key)
    })
  } satisfies INotesApi

  return api
}
