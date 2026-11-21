export const EDITOR_STATUSES = {
  CLOSED: 'closed',
  LOADING: 'loading',
  READY: 'ready',
  MISSING: 'missing',
  ERROR: 'error'
} as const

export const HISTORY_DIRECTIONS = {
  UNDO: 'undo',
  REDO: 'redo'
} as const

export const SAVE_OUTCOMES = {
  SAVED: 'saved',
  CONFLICT: 'conflict',
  DELETED: 'deleted'
} as const

export const DRAFT_OUTCOMES = {
  WRITTEN: 'written',
  CONFLICT: 'conflict',
  DELETED: 'deleted'
} as const

export const CHANGE_TYPES = {
  SAVED: 'saved',
  DELETED: 'deleted'
} as const
