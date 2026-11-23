import type { ValueOf } from '@shared/contract/types'
import type { OPERATION_TYPES } from '@shared/contract/notes/constants'
import type { NoteId, TodoId, DraftKey } from '@shared/contract/notes/ids'
import type { CHANGE_TYPES, DRAFT_OUTCOMES, EDITOR_STATUSES, HISTORY_DIRECTIONS, SAVE_OUTCOMES } from '@notes/constants'

export namespace NNotes {
  export type EditorStatus = ValueOf<typeof EDITOR_STATUSES>

  export type HistoryDirection = ValueOf<typeof HISTORY_DIRECTIONS>

  export type Todo = {
    id: TodoId
    text: string
    done: boolean
  }

  export type Content = {
    title: string
    todos: NNotes.Todo[]
  }

  export type Model = NNotes.Content & {
    id: NoteId
    version: number
    createdAt: number
    updatedAt: number
  }

  export type Baseline = {
    version: number
    updatedAt: number
  }

  export type Summary = {
    id: NoteId
    title: string
    version: number
    updatedAt: number
    total: number
    completed: number
    preview: NNotes.Todo[]
  }

  export type Page = {
    items: NNotes.Summary[]
    nextCursor: string | null
    count: number
  }

  export type ListCache = {
    search: string
    depth: number
    page: NNotes.Page
  }

  export type Resource<TModel> = {
    key: DraftKey
    model: TModel
  }

  export type TitleOperation = {
    type: typeof OPERATION_TYPES.TITLE
    before: string
    after: string
  }

  export type TodoTextOperation = {
    type: typeof OPERATION_TYPES.TODO_TEXT
    todoId: TodoId
    before: string
    after: string
  }

  export type TodoToggleOperation = {
    type: typeof OPERATION_TYPES.TODO_TOGGLE
    todoId: TodoId
    done: boolean
  }

  export type TodoAddOperation = {
    type: typeof OPERATION_TYPES.TODO_ADD
    todo: NNotes.Todo
    index: number
  }

  export type TodoRemoveOperation = {
    type: typeof OPERATION_TYPES.TODO_REMOVE
    todo: NNotes.Todo
    index: number
  }

  export type TextOperation = NNotes.TitleOperation | NNotes.TodoTextOperation

  export type Operation =
    NNotes.TextOperation | NNotes.TodoToggleOperation | NNotes.TodoAddOperation | NNotes.TodoRemoveOperation

  export type HistoryData = {
    undo: NNotes.Operation[]
    redo: NNotes.Operation[]
  }

  export type Draft = {
    noteId: NoteId | null
    baseVersion: number | null
    content: NNotes.Content
    history: NNotes.HistoryData
    savedAt: number
  }

  export type DraftRecovery = {
    key: DraftKey
    baseVersion: number | null
    hasConflict: boolean
  }

  export type DraftCandidate = {
    draft: NNotes.Draft
    recovery: NNotes.DraftRecovery
  }

  export type SaveOptions = {
    isForced?: boolean
    isCopy?: boolean
  }

  export type SaveRequest = NNotes.SaveOptions & {
    key: DraftKey
    content: NNotes.Content
    baseVersion: number | null
    observedVersion?: number | undefined
    hasRejectedVersion?: boolean
  }

  export type DraftWriteRequest = {
    key: DraftKey
    draft: NNotes.Draft | null
    observedVersion?: number | undefined
    keepalive?: boolean
  }

  export type RecoveryRequest = {
    key: DraftKey
    currentVersion: number | null
    draft: NNotes.Draft
  }

  export type CreateBodyOptions = {
    isCopy: boolean
  }

  export type UpdateBodyOptions = {
    baseVersion: number
    isForced: boolean
    confirmedVersion?: number | undefined
  }

  export type DiscardOptions = {
    shouldDeleteNote?: boolean
  }

  export type SavedResult = {
    kind: typeof SAVE_OUTCOMES.SAVED
    note: NNotes.Model
  }

  export type SaveConflictResult = {
    kind: typeof SAVE_OUTCOMES.CONFLICT
    latestVersion?: number | undefined
  }

  export type SaveDeletedResult = {
    kind: typeof SAVE_OUTCOMES.DELETED
  }

  export type SaveResult = NNotes.SavedResult | NNotes.SaveConflictResult | NNotes.SaveDeletedResult

  export type DraftWrittenResult = {
    kind: typeof DRAFT_OUTCOMES.WRITTEN
  }

  export type DraftDeletedResult = {
    kind: typeof DRAFT_OUTCOMES.DELETED
  }

  export type DraftConflictResult = {
    kind: typeof DRAFT_OUTCOMES.CONFLICT
    latest: NNotes.Model
    shouldRetry: boolean
  }

  export type DraftResult = NNotes.DraftWrittenResult | NNotes.DraftDeletedResult | NNotes.DraftConflictResult

  export type Change = {
    type: ValueOf<typeof CHANGE_TYPES>
    id: NoteId
  }

  export type ChangeHandler = (change: NNotes.Change) => void

  export type ErrorReport = (error: unknown) => void
}
