import { OPERATION_TYPES } from '@shared/contract/notes/constants'
import type { TodoId } from '@shared/contract/notes/ids'
import type { NNotes } from '@notes/domain'
import { isBlankTodo } from './content'

type AddTarget = {
  id: TodoId
  after?: TodoId | undefined
}

export const toAddOperation = (content: NNotes.Content, { id, after }: AddTarget): NNotes.TodoAddOperation => ({
  type: OPERATION_TYPES.TODO_ADD,
  todo: { id, text: '', done: false },
  index: after ? content.todos.findIndex((todo) => todo.id === after) + 1 : content.todos.length
})

export const toRemoveOperation = (content: NNotes.Content, id: TodoId): NNotes.TodoRemoveOperation | null => {
  const index = content.todos.findIndex((todo) => todo.id === id)
  const todo = content.todos[index]

  return todo ? { type: OPERATION_TYPES.TODO_REMOVE, todo: { ...todo }, index } : null
}

export const toToggleOperation = (content: NNotes.Content, id: TodoId): NNotes.TodoToggleOperation | null => {
  const todo = content.todos.find((item) => item.id === id)

  if (!todo || (!todo.done && isBlankTodo(todo))) {
    return null
  }

  return { type: OPERATION_TYPES.TODO_TOGGLE, todoId: id, done: !todo.done }
}
