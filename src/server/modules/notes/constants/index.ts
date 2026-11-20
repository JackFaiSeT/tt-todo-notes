export const NOTES_ERROR_MESSAGES = {
  NOT_FOUND: 'Заметка удалена или не существует.',
  VERSION_CONFLICT: 'В другой вкладке сохранена новая версия заметки.',
  DRAFT_UNREADABLE: 'Не удалось прочитать черновик. Сохранённая заметка доступна для редактирования.',
  DRAFT_KEY_MISMATCH: 'Ключ черновика не соответствует заметке.'
} as const

export const NOTES_VALIDATION_MESSAGES = {
  ENTITY_ID: 'Некорректный идентификатор.',
  TEXT: 'Недопустимый текст.',
  DUPLICATE_TODOS: 'Идентификаторы пунктов повторяются.',
  DRAFT_VERSION: 'Версия должна соответствовать заметке.',
  EMPTY_CONTENT: 'Введите название или хотя бы один пункт.',
  CURSOR: 'Некорректный курсор.'
} as const

export const DRAFT_MIGRATION_ERRORS = {
  INVALID_STEP: 'Некорректная миграция',
  UNKNOWN_VERSION: 'Неизвестная версия черновика'
} as const

export const DRAFT_NOTE_FIELD = 'draft.noteId'

export const LIST_QUERY_PATTERNS = {
  LIMIT: /^[1-9]\d*$/u
} as const

export const CURSOR_TIME_PATTERN = /^(?:0|[1-9]\d{0,15})$/u

export const CURSOR_SEPARATOR = '.'
