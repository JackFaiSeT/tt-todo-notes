export const LOG_EVENTS = {
  DATABASE_READY: 'database.ready',
  STARTUP_FAILED: 'startup.failed',
  REQUEST_FAILED: 'request.failed',
  NITRO_ERROR: 'nitro.error'
} as const

export const LOG_LEVELS = {
  ERROR: 'error',
  INFO: 'info'
} as const

export const LOG_PLACEHOLDERS = {
  REDACTED: '[Redacted]',
  CIRCULAR: '[Circular]'
} as const

export const SENSITIVE_FIELDS: ReadonlySet<string> = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'cookies',
  'set-cookie',
  'x-api-key',
  'apikey',
  'password',
  'name',
  'email',
  'phone',
  'body',
  'payload',
  'title',
  'text',
  'message'
])

export const SENSITIVE_FIELD_PATTERN = /(?:token|secret)$/iu

export const ERROR_CODE_PATTERN = /^(?:SQLITE_|ERR_|E[A-Z])[A-Z0-9_]{1,60}$/u

export const STACK_FRAME_PREFIX = '    at '
