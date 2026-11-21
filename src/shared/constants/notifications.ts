export const NOTIFICATION_KINDS = {
  SUCCESS: 'success',
  ERROR: 'error'
} as const

export const NOTIFICATION_DURATIONS_MS = {
  [NOTIFICATION_KINDS.SUCCESS]: 3000,
  [NOTIFICATION_KINDS.ERROR]: 6000
} as const

export const NOTIFICATIONS_LIMIT = 3
