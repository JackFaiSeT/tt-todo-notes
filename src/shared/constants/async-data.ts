import type { AsyncDataRequestStatus } from '#app'

export const ASYNC_DATA_STATUSES = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error'
} as const satisfies Record<string, AsyncDataRequestStatus>

export const ASYNC_DATA_DEDUPE = {
  CANCEL: 'cancel',
  DEFER: 'defer'
} as const
