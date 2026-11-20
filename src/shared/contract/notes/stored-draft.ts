import { isNonNegativeInteger, isRecord } from '@shared/contract/guards'
import {
  DRAFT_SCHEMA_VERSION,
  HISTORY_LIMIT,
  ITEM_LIMIT,
  NEW_DRAFT_KEY,
  OPERATION_TYPES,
  TITLE_LIMIT,
  TODO_LIMIT
} from './constants'
import type { Draft, HistoryData, Operation, Todo } from './types'
import { isOperationText } from './content'
import { parseNoteId, parseTodoId } from './ids'

const readText = (value: unknown, limit: number): string => {
  if (isOperationText(value, limit)) {
    return value
  }

  throw new TypeError('Недопустимый текст операции.')
}

const hasOnlyKeys = (record: Record<string, unknown>, keys: string[]): boolean =>
  Object.keys(record).every((key) => keys.includes(key))

const readOperation = (data: unknown): Operation => {
  if (isRecord(data)) {
    const type = data.type

    switch (type) {
      case OPERATION_TYPES.TITLE:
        if (hasOnlyKeys(data, ['type', 'before', 'after'])) {
          return { type, before: readText(data.before, TITLE_LIMIT), after: readText(data.after, TITLE_LIMIT) }
        }

        break
      case OPERATION_TYPES.TODO_TEXT:
        if (hasOnlyKeys(data, ['type', 'todoId', 'before', 'after'])) {
          return {
            type,
            todoId: parseTodoId(data.todoId),
            before: readText(data.before, TODO_LIMIT),
            after: readText(data.after, TODO_LIMIT)
          }
        }

        break
      case OPERATION_TYPES.TODO_TOGGLE:
        if (hasOnlyKeys(data, ['type', 'todoId', 'done']) && typeof data.done === 'boolean') {
          return { type, todoId: parseTodoId(data.todoId), done: data.done }
        }

        break
      case OPERATION_TYPES.TODO_ADD:
      case OPERATION_TYPES.TODO_REMOVE: {
        const { todo, index } = data

        if (
          hasOnlyKeys(data, ['type', 'todo', 'index']) &&
          isNonNegativeInteger(index) &&
          isRecord(todo) &&
          hasOnlyKeys(todo, ['id', 'text', 'done']) &&
          typeof todo.done === 'boolean'
        ) {
          return {
            type,
            index,
            todo: { id: parseTodoId(todo.id), text: readText(todo.text, TODO_LIMIT), done: todo.done }
          }
        }

        break
      }
    }
  }

  throw new TypeError('Недопустимая операция черновика.')
}

const toHistory = (data: unknown): HistoryData => {
  if (
    !isRecord(data) ||
    !hasOnlyKeys(data, ['undo', 'redo']) ||
    !Array.isArray(data.undo) ||
    !Array.isArray(data.redo) ||
    data.undo.length + data.redo.length > HISTORY_LIMIT
  ) {
    throw new TypeError('Недопустимая история черновика.')
  }

  return { undo: data.undo.map(readOperation), redo: data.redo.map(readOperation) }
}

const readStoredTodo = (data: unknown): Todo => {
  if (
    !isRecord(data) ||
    typeof data.text !== 'string' ||
    data.text.length > TODO_LIMIT ||
    typeof data.done !== 'boolean'
  ) {
    throw new TypeError('Недопустимый пункт черновика.')
  }

  return { id: parseTodoId(data.id), text: data.text, done: data.done }
}

export const readStoredDraft = (data: unknown): Draft => {
  if (!isRecord(data) || data.schemaVersion !== DRAFT_SCHEMA_VERSION || !isNonNegativeInteger(data.savedAt)) {
    throw new TypeError('Недопустимый формат черновика.')
  }

  const { baseVersion, content } = data
  const noteId = data.noteId === null ? null : parseNoteId(data.noteId)

  if (
    noteId === NEW_DRAFT_KEY ||
    (baseVersion !== null && (!isNonNegativeInteger(baseVersion) || baseVersion === 0)) ||
    (noteId === null) !== (baseVersion === null)
  ) {
    throw new TypeError('Недопустимая версия заметки.')
  }

  if (
    !isRecord(content) ||
    typeof content.title !== 'string' ||
    content.title.length > TITLE_LIMIT ||
    !Array.isArray(content.todos) ||
    content.todos.length > ITEM_LIMIT
  ) {
    throw new TypeError('Недопустимое содержимое черновика.')
  }

  const todos = content.todos.map(readStoredTodo)

  if (new Set(todos.map((todo) => todo.id)).size !== todos.length) {
    throw new TypeError('Повтор пункта черновика.')
  }

  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    noteId,
    baseVersion,
    savedAt: data.savedAt,
    content: { title: content.title, todos },
    history: toHistory(data.history)
  }
}
