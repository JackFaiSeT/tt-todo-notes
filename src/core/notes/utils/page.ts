import { NOTE_PAGE_DEFAULT, NOTE_PAGE_MAX } from '@shared/contract/notes/constants'
import type { NNotes } from '@notes/domain'

export const toRefreshLimits = (depth: number): number[] =>
  Array.from({ length: Math.ceil((depth * NOTE_PAGE_DEFAULT) / NOTE_PAGE_MAX) }, (_, index) =>
    Math.min(NOTE_PAGE_MAX, depth * NOTE_PAGE_DEFAULT - index * NOTE_PAGE_MAX)
  )

export const mergePages = (previous: NNotes.Page, next: NNotes.Page): NNotes.Page => {
  const knownIds = new Set(previous.items.map((note) => note.id))

  return {
    items: [...previous.items, ...next.items.filter((note) => !knownIds.has(note.id))],
    nextCursor: next.nextCursor,
    count: next.count
  }
}
