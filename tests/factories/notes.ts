import { DRAFT_SCHEMA_VERSION } from '@shared/contract/notes/constants'
import { parseTodoId } from '@shared/contract/notes/ids'
import type { Draft, NoteContent } from '@shared/contract/notes/types'

export const createTitleOnlyContent = (title: string): NoteContent => ({ title, todos: [] })

export const createChecklist = (count: number, completed: number): NoteContent => ({
  title: ' План ',
  todos: Array.from({ length: count }, (_, index) => ({
    id: parseTodoId(String(index)),
    text: ' Пункт ' + index,
    done: index < completed
  }))
})

export const createContent = (): NoteContent => ({
  title: ' План ',
  todos: [{ id: parseTodoId('first'), text: ' Первый ', done: false }]
})

export const createNewDraft = (): Draft => ({
  schemaVersion: DRAFT_SCHEMA_VERSION,
  noteId: null,
  baseVersion: null,
  content: createContent(),
  history: { undo: [], redo: [] },
  savedAt: 123
})
