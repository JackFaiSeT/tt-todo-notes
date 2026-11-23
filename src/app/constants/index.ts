export const APP_NAME = 'Todo Notes'

export const APP_TITLE_SEPARATOR = ' · '

export const PAGE_SEO = {
  NOTES_LIST: {
    title: 'Заметки',
    description: 'Список заметок и дел.'
  },
  NOTE_EDITOR: {
    description: 'Редактор заметки и списка дел.'
  },
  ERROR: {
    description: 'Возврат к списку заметок.'
  }
} as const

export const APP_ERROR_SOURCES = {
  VUE: 'vue:error',
  APP: 'app:error'
} as const
