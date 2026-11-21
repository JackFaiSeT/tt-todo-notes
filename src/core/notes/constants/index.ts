import type { DraftKey } from '@shared/contract/notes/ids'

export const NOTES_KEY = 'notes' as const

export const NOTES_CHANNEL_NAME = 'todo-notes:notes' as const

export const NOTES_DATA_KEYS = {
  list: 'notes:list',
  listCache: 'notes:list:cache',
  note: (key: DraftKey): string => `notes:note:${key}`,
  draft: (key: DraftKey): string => `notes:draft:${key}`
} as const

export const NOTES_STORAGE_KEYS = {
  draft: (key: DraftKey): string => `todo-notes:draft:${key}`
} as const

export const HISTORY_DELAY_MS = 700

export const DRAFT_DELAY_MS = 800

export const RESUME_REFRESH_WINDOW_MS = 1500

export { NOTES_CONTRACT_VIOLATIONS, NOTES_ERROR_TEXTS, NOTES_FAILURE_TEXTS } from './errors'
export { NOTE_ROUTES } from './routes'
export { CHANGE_TYPES, DRAFT_OUTCOMES, EDITOR_STATUSES, HISTORY_DIRECTIONS, SAVE_OUTCOMES } from './statuses'
export { NOTE_PROGRESS_TEXTS, NOTE_TEXTS } from './texts'
