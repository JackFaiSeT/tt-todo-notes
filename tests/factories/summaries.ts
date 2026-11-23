import { parseNoteId } from '@shared/contract/notes/ids'
import type { NNotes } from '@notes/domain'

export const createSummary = (id: string, overrides: Partial<NNotes.Summary> = {}): NNotes.Summary => ({
  id: parseNoteId(id),
  title: id,
  version: 1,
  updatedAt: 0,
  total: 0,
  completed: 0,
  preview: [],
  ...overrides
})
