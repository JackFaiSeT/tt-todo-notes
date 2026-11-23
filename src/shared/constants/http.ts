export const HTTP_ERROR_KINDS = {
  RESPONSE: 'response',
  NETWORK: 'network',
  REQUEST: 'request'
} as const

export const HTTP_ERROR_NAMES = {
  HTTP: 'HttpError',
  ABORT: 'AbortError'
} as const

export const HTTP_NO_STATUS = 0

export const HTTP_CLIENT_TEXTS = {
  MISSING_PATH_PARAMETER: 'Отсутствует параметр пути.'
} as const

export const HTTP_REQUEST_TIMEOUT_MS = 15_000

export const HTTP_KEEPALIVE_BYTES_MAX = 60 * 1024

export const HTTP_PATH_PARAMETER_PATTERN = /:(\w+)/gu
