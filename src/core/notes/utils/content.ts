import { ITEM_LIMIT } from '@shared/contract/notes/constants'
import { hasContent } from '@shared/contract/notes/content'
import type { NNotes } from '@notes/domain'

export const toContent = (note?: NNotes.Content): NNotes.Content => ({
  title: note?.title ?? '',
  todos: note?.todos.map((todo) => ({ ...todo })) ?? []
})

export const isSameContent = (left: NNotes.Content, right: NNotes.Content): boolean =>
  left.title === right.title &&
  left.todos.length === right.todos.length &&
  left.todos.every((todo, index) => {
    const other = right.todos[index]

    return other && todo.id === other.id && todo.text === other.text && todo.done === other.done
  })

export const canAddTodo = (content: NNotes.Content): boolean => content.todos.length < ITEM_LIMIT

export const countCompleted = (content: NNotes.Content): number => content.todos.filter((todo) => todo.done).length

export const isBlankTodo = (todo: NNotes.Todo): boolean => !todo.text.trim()

export const hasEmptyTodos = (content: NNotes.Content): boolean => content.todos.some(isBlankTodo)

export const canSaveContent = (content: NNotes.Content): boolean => hasContent(content) && !hasEmptyTodos(content)
