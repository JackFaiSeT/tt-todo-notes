import { ERROR_CODES, HTTP_STATUS } from '@shared/contract/http'
import { ApiError } from './api-error'
import { BODY_ERROR_FIELD, COMMON_ERROR_MESSAGES } from './messages'

export const validationFailed = (fieldErrors: Record<string, string[]>): ApiError =>
  new ApiError({
    status: HTTP_STATUS.BAD_REQUEST,
    code: ERROR_CODES.VALIDATION_FAILED,
    message: COMMON_ERROR_MESSAGES.VALIDATION_FAILED,
    fieldErrors
  })

export const invalidJson = (): ApiError =>
  validationFailed({ [BODY_ERROR_FIELD]: [COMMON_ERROR_MESSAGES.INVALID_JSON] })

export const payloadTooLarge = (): ApiError =>
  new ApiError({
    status: HTTP_STATUS.PAYLOAD_TOO_LARGE,
    code: ERROR_CODES.PAYLOAD_TOO_LARGE,
    message: COMMON_ERROR_MESSAGES.PAYLOAD_TOO_LARGE
  })

export const routeNotFound = (): ApiError =>
  new ApiError({
    status: HTTP_STATUS.NOT_FOUND,
    code: ERROR_CODES.ROUTE_NOT_FOUND,
    message: COMMON_ERROR_MESSAGES.ROUTE_NOT_FOUND
  })

export const databaseUnavailable = (cause: unknown): ApiError =>
  new ApiError({
    status: HTTP_STATUS.SERVICE_UNAVAILABLE,
    code: ERROR_CODES.DATABASE_UNAVAILABLE,
    message: COMMON_ERROR_MESSAGES.DATABASE_UNAVAILABLE,
    cause
  })

export const internalError = (cause: unknown): ApiError =>
  new ApiError({
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: COMMON_ERROR_MESSAGES.INTERNAL_ERROR,
    cause
  })

export const forbidden = (): ApiError =>
  new ApiError({
    status: HTTP_STATUS.FORBIDDEN,
    code: ERROR_CODES.FORBIDDEN,
    message: COMMON_ERROR_MESSAGES.FORBIDDEN
  })

export const unsupportedMediaType = (): ApiError =>
  new ApiError({
    status: HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
    code: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
    message: COMMON_ERROR_MESSAGES.UNSUPPORTED_MEDIA_TYPE
  })
