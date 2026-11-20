import type { NoteContent } from './types'

export const hasContent = (content: NoteContent): boolean =>
  Boolean(content.title.trim() || content.todos.some((todo) => todo.text.trim()))

const CONTROL_CHARACTER = /\p{Cc}/u

const CONTROL_CHARACTERS = /\p{Cc}/gu

export const isOperationText = (value: unknown, limit: number): value is string =>
  typeof value === 'string' && value.length <= limit && !CONTROL_CHARACTER.test(value)

export const toPlainText = (value: string): string => value.replace(CONTROL_CHARACTERS, ' ')

export const normalize = <T extends { text: string }>(content: {
  title: string
  todos: T[]
}): { title: string; todos: T[] } => ({
  title: content.title.trim(),
  todos: content.todos.map((todo) => ({ ...todo, text: todo.text.trim() })).filter((todo) => todo.text)
})
