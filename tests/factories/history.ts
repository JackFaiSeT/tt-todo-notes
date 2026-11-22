import { OPERATION_TYPES } from '@shared/contract/notes/constants'
import { parseTodoId } from '@shared/contract/notes/ids'
import type { NNotes } from '@notes/domain'

export const todo = { id: parseTodoId('a'), text: 'Один', done: false }

export const start = { title: 'План', todos: [todo] }

const added = { id: parseTodoId('b'), text: 'Два', done: true }

export const operations: NNotes.Operation[] = [
  { type: OPERATION_TYPES.TITLE, before: 'План', after: 'Итоги' },
  { type: OPERATION_TYPES.TODO_TEXT, todoId: todo.id, before: 'Один', after: 'Три' },
  { type: OPERATION_TYPES.TODO_TOGGLE, todoId: todo.id, done: true },
  { type: OPERATION_TYPES.TODO_ADD, todo: added, index: 0 },
  { type: OPERATION_TYPES.TODO_REMOVE, todo, index: 0 }
]
