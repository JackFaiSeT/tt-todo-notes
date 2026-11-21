import { OPERATION_TYPES } from '@shared/contract/notes/constants'
import type { TodoId } from '@shared/contract/notes/ids'
import type { NNotes } from '@notes/domain'

type ApplyOperationOptions = {
  operation: NNotes.Operation
  isReversed?: boolean
}

type TodoPatch = {
  todoId: TodoId
  patch: Partial<NNotes.Todo>
}

const assertNever = (value: never): never => {
  throw new TypeError(String(value))
}

const patchTodo = (content: NNotes.Content, { todoId, patch }: TodoPatch): NNotes.Content => ({
  ...content,
  todos: content.todos.map((todo) => (todo.id === todoId ? { ...todo, ...patch } : todo))
})

const insertTodo = (content: NNotes.Content, { todo, index }: NNotes.TodoAddOperation): NNotes.Content => ({
  ...content,
  todos: content.todos.toSpliced(index, 0, { ...todo })
})

const removeTodo = (content: NNotes.Content, todoId: TodoId): NNotes.Content => ({
  ...content,
  todos: content.todos.filter((todo) => todo.id !== todoId)
})

export const applyOperation = (
  content: NNotes.Content,
  { operation, isReversed = false }: ApplyOperationOptions
): NNotes.Content => {
  switch (operation.type) {
    case OPERATION_TYPES.TITLE:
      return { ...content, title: isReversed ? operation.before : operation.after }
    case OPERATION_TYPES.TODO_TEXT:
      return patchTodo(content, {
        todoId: operation.todoId,
        patch: { text: isReversed ? operation.before : operation.after }
      })
    case OPERATION_TYPES.TODO_TOGGLE:
      return patchTodo(content, {
        todoId: operation.todoId,
        patch: { done: isReversed ? !operation.done : operation.done }
      })
    case OPERATION_TYPES.TODO_ADD:
      return isReversed ? removeTodo(content, operation.todo.id) : insertTodo(content, operation)
    case OPERATION_TYPES.TODO_REMOVE:
      return isReversed
        ? insertTodo(content, { ...operation, type: OPERATION_TYPES.TODO_ADD })
        : removeTodo(content, operation.todo.id)
  }

  return assertNever(operation)
}
