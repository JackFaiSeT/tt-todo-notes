import type { ValueOf } from './types'
import { isValueOf } from './guards'

export const BODY_BYTES_MAX = 1024 * 1024

export const JSON_MEDIA_TYPE = 'application/json'

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  UNSUPPORTED_MEDIA_TYPE: 415,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
} as const

export const HTTP_HEADERS = {
  CONTENT_TYPE: 'content-type',
  REQUEST_ID: 'x-request-id'
} as const

export const API_PREFIX = '/api'

export const ERROR_CODES = {
  FORBIDDEN: 'FORBIDDEN',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOTE_NOT_FOUND: 'NOTE_NOT_FOUND',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  DRAFT_UNREADABLE: 'DRAFT_UNREADABLE',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE'
} as const

export const ERROR_CATEGORIES = {
  FORBIDDEN: 'FORBIDDEN',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  INTERNAL: 'INTERNAL',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const

export type HttpStatus = ValueOf<typeof HTTP_STATUS>

export type ErrorCode = ValueOf<typeof ERROR_CODES>

export type ErrorCategory = ValueOf<typeof ERROR_CATEGORIES>

export type ErrorEnvelope = {
  code: ErrorCode
  category: ErrorCategory
  message: string
  requestId: string
  details?: Record<string, unknown> | undefined
  fieldErrors?: Record<string, string[]> | undefined
}

export const isErrorCode = (value: unknown): value is ErrorCode => isValueOf(ERROR_CODES, value)

export const isErrorCategory = (value: unknown): value is ErrorCategory => isValueOf(ERROR_CATEGORIES, value)
