import type { DRAFT_SCHEMA_VERSION, OPERATION_TYPES } from './constants'
import type { DraftKey, NoteId, TodoId } from './ids'

export type Todo = {
  id: TodoId
  text: string
  done: boolean
}

export type NoteContent = {
  title: string
  todos: Todo[]
}

export type Note = NoteContent & {
  id: NoteId
  createdAt: number
  updatedAt: number
  version: number
}

export type NoteSummary = Pick<Note, 'id' | 'title' | 'updatedAt' | 'version'> & {
  total: number
  completed: number
  preview: Todo[]
}

export type NotePage = {
  items: NoteSummary[]
  nextCursor: string | null
  count: number
}

export type Operation =
  | {
      type: typeof OPERATION_TYPES.TITLE
      before: string
      after: string
    }
  | {
      type: typeof OPERATION_TYPES.TODO_TEXT
      todoId: TodoId
      before: string
      after: string
    }
  | {
      type: typeof OPERATION_TYPES.TODO_TOGGLE
      todoId: TodoId
      done: boolean
    }
  | {
      type: typeof OPERATION_TYPES.TODO_ADD
      todo: Todo
      index: number
    }
  | {
      type: typeof OPERATION_TYPES.TODO_REMOVE
      todo: Todo
      index: number
    }

export type HistoryData = {
  undo: Operation[]
  redo: Operation[]
}

export type Draft = {
  schemaVersion: typeof DRAFT_SCHEMA_VERSION
  noteId: NoteId | null
  baseVersion: number | null
  content: NoteContent
  history: HistoryData
  savedAt: number
}

export type NotePageQuery = {
  cursor?: string | undefined
  limit?: number | undefined
  q?: string | undefined
}

export type NoteParams = {
  id: NoteId
}

export type DraftParams = {
  key: DraftKey
}

export type CreateNote = NoteContent & {
  fromDeletedNote?: boolean | undefined
}

export type UpdateNote = NoteContent & {
  baseVersion: number
  force?: boolean | undefined
  confirmedVersion?: number | undefined
}

export type PutDraft = {
  draft: Draft
  observedVersion?: number | undefined
}
