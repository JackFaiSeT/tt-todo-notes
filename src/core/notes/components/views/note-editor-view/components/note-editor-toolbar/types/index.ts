import type { NNotes } from '@notes/domain'

export type Props = {
  statusText: string
  saveHintId: string
  canUndo: boolean
  canRedo: boolean
  isDirty: boolean
  isValid: boolean
  isExisting: boolean
  isBusy: boolean
  isPending: boolean
}

export type NoteEditorToolbarHandle = {
  getBottom: () => number | undefined
  contains: (element: Element) => boolean
}

export type Emits = {
  step: [direction: NNotes.HistoryDirection]
  cancel: []
  remove: []
  save: []
  invalid: []
}
