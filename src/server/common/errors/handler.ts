import { send, setResponseHeader, setResponseStatus } from 'h3'
import type { H3Event, H3Error } from 'h3'
import type { Logger } from 'pino'
import { diagnosticFields } from '#server/common/logging'
import { withRequestContext } from '#server/common/request-context'
import {
  DATABASE_UNAVAILABLE_PATTERN,
  JSON_CONTENT_TYPE,
  RETRY_AFTER_SECONDS,
  UNMATCHED_ROUTE
} from '#server/common/http/constants'
import { SERVER_HEADERS } from '#server/common/http/headers'
import { LOG_EVENTS, LOG_LEVELS } from '#server/common/logging/constants'
import { ERROR_CATEGORIES, HTTP_STATUS } from '@shared/contract/http'
import type { ErrorEnvelope } from '@shared/contract/http'
import { ApiError } from './api-error'
import { errorCauses } from './causes'
import { databaseUnavailable, internalError, routeNotFound } from './common.errors'

const ERROR_CATEGORY_BY_STATUS: Partial<Record<number, ErrorEnvelope['category']>> = {
  [HTTP_STATUS.BAD_REQUEST]: ERROR_CATEGORIES.VALIDATION_FAILED,
  [HTTP_STATUS.FORBIDDEN]: ERROR_CATEGORIES.FORBIDDEN,
  [HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE]: ERROR_CATEGORIES.UNSUPPORTED_MEDIA_TYPE,
  [HTTP_STATUS.NOT_FOUND]: ERROR_CATEGORIES.NOT_FOUND,
  [HTTP_STATUS.CONFLICT]: ERROR_CATEGORIES.CONFLICT,
  [HTTP_STATUS.PAYLOAD_TOO_LARGE]: ERROR_CATEGORIES.PAYLOAD_TOO_LARGE,
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: ERROR_CATEGORIES.SERVICE_UNAVAILABLE
}

export const findApiError = (error: unknown): ApiError | undefined =>
  errorCauses(error).find((cause) => cause instanceof ApiError)

const isDatabaseUnavailable = (error: unknown): boolean =>
  errorCauses(error).some(
    (cause) => 'code' in cause && typeof cause.code === 'string' && DATABASE_UNAVAILABLE_PATTERN.test(cause.code)
  )

export const toApiFailure = (error: H3Error): ApiError => {
  const known = findApiError(error)

  if (known) {
    return known
  }

  if (error.statusCode === HTTP_STATUS.NOT_FOUND) {
    return routeNotFound()
  }

  return isDatabaseUnavailable(error) ? databaseUnavailable(error) : internalError(error)
}

export const handleApiError = (error: H3Error, event: H3Event, logger: Logger): Promise<void> =>
  withRequestContext(event, ({ requestId }) => {
    const failure = toApiFailure(error)

    const field = failure.details?.field

    const body: ErrorEnvelope = {
      code: failure.code,
      message: failure.message,
      category: ERROR_CATEGORY_BY_STATUS[failure.status] ?? ERROR_CATEGORIES.INTERNAL,
      requestId,
      details: failure.details,
      fieldErrors: failure.fieldErrors ?? (typeof field === 'string' ? { [field]: [failure.message] } : undefined)
    }

    const isServerFailure = failure.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR

    logger[isServerFailure ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO](
      {
        method: event.method,
        route: event.context.matchedRoute?.path ?? UNMATCHED_ROUTE,
        status: failure.status,
        code: failure.code,
        ...(isServerFailure && diagnosticFields(failure.cause))
      },
      LOG_EVENTS.REQUEST_FAILED
    )

    setResponseStatus(event, failure.status)

    if (failure.status === HTTP_STATUS.SERVICE_UNAVAILABLE) {
      setResponseHeader(event, SERVER_HEADERS.RETRY_AFTER, RETRY_AFTER_SECONDS)
    }

    return send(event, JSON.stringify(body), JSON_CONTENT_TYPE)
  })
