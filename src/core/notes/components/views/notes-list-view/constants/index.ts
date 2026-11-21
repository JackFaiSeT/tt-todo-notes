export const NOTES_LIST_TEXTS = {
  TITLE: 'Заметки',
  CREATE: 'Новая заметка',
  SORT: 'По дате изменения',
  LOADING: 'Загружаем заметки…',
  LOAD_ERROR: 'Не удалось загрузить список.',
  MORE: 'Показать ещё',
  LOADING_MORE: 'Загружаем…',
  REMOVED: 'Заметка удалена',
  COUNT: (count: number): string => `Количество заметок: ${count}`,
  FOUND: (count: number): string => `Найдено заметок: ${count}`,
  NOTHING_FOUND: 'Ничего не найдено',
  ADDED: (count: number): string => `Добавлено заметок: ${count}`,
  SEARCH: 'Найти по названию или пункту',
  SEARCH_CLEAR: 'Очистить поиск',
  SEARCH_ERROR: 'Не удалось выполнить поиск.'
} as const

export const NOTE_REMOVAL_DIALOG = {
  TITLE: 'Удалить заметку?',
  DESCRIPTION: (title: string): string => `«${title}» будет удалена со всеми пунктами.`,
  ACCEPT: 'Удалить',
  DECLINE: 'Оставить'
} as const

export const NOTES_LIST_SKELETONS = {
  INITIAL: 6,
  MORE: 3
} as const

export const NOTE_CELL_ATTRIBUTE = 'data-note-id'

export const NOTES_SEARCH_QUERY_KEY = 'q'

export const NOTES_SEARCH_DELAY_MS = 300
