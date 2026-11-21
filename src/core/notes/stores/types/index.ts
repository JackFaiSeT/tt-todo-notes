import type { DraftKey, TodoId } from '@shared/contract/notes/ids'
import type { NNotes } from '@notes/domain'

export type SessionToken = {
  isCurrent: () => boolean
}

export type EditorStore = {
  key: Readonly<ShallowRef<DraftKey>>
  status: Readonly<ShallowRef<NNotes.EditorStatus>>
  base: Readonly<ShallowRef<NNotes.Baseline | null>>
  baseVersion: Readonly<ShallowRef<number | null>>
  remoteVersion: Readonly<ShallowRef<number | undefined>>
  isBusy: Readonly<ShallowRef<boolean>>
  isDeleted: Readonly<ShallowRef<boolean>>
  hasCandidate: Readonly<ShallowRef<boolean>>
  hasRejectedVersion: Readonly<ShallowRef<boolean>>
  revision: Readonly<ShallowRef<number>>
  content: ComputedRef<NNotes.Content>
  isDirty: ComputedRef<boolean>
  isValid: ComputedRef<boolean>
  hasConflict: ComputedRef<boolean>
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>
  openSession: (key: DraftKey) => void
  closeSession: () => void
  captureSession: () => SessionToken
  applyLoaded: (note: NNotes.Model | null, draft: NNotes.Draft | null) => void
  applySaved: (note: NNotes.Model) => void
  restoreDraft: (draft: NNotes.Draft, recovery: NNotes.DraftRecovery) => void
  revertSession: () => void
  observeNote: (note: NNotes.Model | null) => void
  observeDraft: (draft: NNotes.Draft | null) => void
  markFailed: () => void
  markDeleted: () => void
  rejectVersion: (latestVersion?: number) => void
  dismissCandidate: () => void
  holdCandidate: () => void
  startMutation: () => SessionToken | undefined
  finishMutation: () => void
  inputTitle: (value: string) => void
  inputTodo: (id: TodoId, value: string) => void
  commitInput: () => void
  addTodo: (after?: TodoId) => TodoId | undefined
  removeTodo: (id: TodoId) => void
  toggleTodo: (id: TodoId) => void
  stepHistory: (direction: NNotes.HistoryDirection) => boolean
  serializeHistory: () => NNotes.HistoryData
}
