import { API_PREFIX } from '@shared/contract/http'

export const TITLE_LIMIT = 200

export const TODO_LIMIT = 500

export const ITEM_LIMIT = 200

export const HISTORY_LIMIT = 50

export const NOTE_PAGE_DEFAULT = 30

export const NOTE_PAGE_MAX = 100

export const NOTE_PREVIEW_TEXT_MAX = 140

export const NOTE_SEARCH_MAX = 100

export const NOTE_PREVIEW_TODOS_MAX = 4

export const DRAFT_SCHEMA_VERSION = 1

export const NEW_DRAFT_KEY = 'new'

export const OPERATION_TYPES = {
  TITLE: 'title',
  TODO_TEXT: 'todo-text',
  TODO_TOGGLE: 'todo-toggle',
  TODO_ADD: 'todo-add',
  TODO_REMOVE: 'todo-remove'
} as const

export const NOTES_PATHS = {
  COLLECTION: `${API_PREFIX}/notes`,
  NOTE: `${API_PREFIX}/notes/:id`,
  DRAFT: `${API_PREFIX}/drafts/:key`
} as const
