import type { NNotes } from '@notes/domain'

export type Props = {
  todo: NNotes.Todo
  index: number
  isBusy?: boolean
  hintId?: string | undefined
}

export type Emits = {
  text: [value: string]
  commit: []
  toggle: []
  remove: []
  insert: []
}
