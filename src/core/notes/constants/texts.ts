export const NOTE_TEXTS = {
  UNTITLED: 'Без названия',
  NEW: 'Новая заметка',
  FALLBACK_TITLE: 'Заметка',
  MISSING: 'Заметка не найдена',
  BACK_TO_LIST: 'К списку заметок',
  RETRY: 'Повторить'
} as const

export const NOTE_PROGRESS_TEXTS = {
  DONE_PREFIX: 'Выполнено ',
  EMPTY: 'нет пунктов',
  COUNT: (completed: number, total: number): string => `${completed} из ${total}`
} as const
