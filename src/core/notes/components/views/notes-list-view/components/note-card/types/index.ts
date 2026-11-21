import type { NNotes } from '@notes/domain'

export type Props = {
  note: NNotes.Summary
}

export type Emits = {
  remove: [note: NNotes.Summary]
}
