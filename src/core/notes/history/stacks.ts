import { HISTORY_LIMIT } from '@shared/contract/notes/constants'
import type { NNotes } from '@notes/domain'

export const appendOperation = (stack: NNotes.Operation[], operation: NNotes.Operation): NNotes.Operation[] =>
  [...stack, operation].slice(-HISTORY_LIMIT)

export const snapshotHistory = (stacks: NNotes.HistoryData, pending?: NNotes.TextOperation): NNotes.HistoryData => ({
  undo: pending ? appendOperation(stacks.undo, { ...pending }) : [...stacks.undo],
  redo: pending ? [] : [...stacks.redo]
})
