import { isRecord } from '@shared/contract/guards'
import { isErrorCategory, isErrorCode } from '@shared/contract/http'
import type { ErrorCode } from '@shared/contract/http'
import { HTTP_ERROR_KINDS, HTTP_ERROR_NAMES, HTTP_NO_STATUS } from '@shared/constants/http'
import type { HttpErrorKind, HttpFailure, HttpFieldErrors } from './types'

export class HttpError extends Error {
  readonly kind: HttpErrorKind

  readonly status: number

  readonly code: ErrorCode | undefined

  readonly requestId: string | undefined

  readonly fieldErrors: HttpFieldErrors

  constructor(failure: HttpFailure) {
    super(failure.code ?? failure.kind)
    this.name = HTTP_ERROR_NAMES.HTTP
    this.kind = failure.kind
    this.status = failure.status
    this.code = failure.code
    this.requestId = failure.requestId
    this.fieldErrors = failure.fieldErrors
  }
}

export const isHttpError = (error: unknown): error is HttpError => error instanceof HttpError

const isMessageList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item: unknown): item is string => typeof item === 'string')

const toFieldErrors = (value: unknown): HttpFieldErrors => {
  if (!isRecord(value)) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string[]] => isMessageList(entry[1]))
  )
}

const toStatus = (error: unknown): number =>
  isRecord(error) && typeof error.statusCode === 'number' ? error.statusCode : HTTP_NO_STATUS

export const toHttpError = (error: unknown): HttpError => {
  const status = toStatus(error)
  const data = isRecord(error) ? error.data : undefined

  if (
    isRecord(data) &&
    isErrorCode(data.code) &&
    isErrorCategory(data.category) &&
    typeof data.message === 'string' &&
    typeof data.requestId === 'string' &&
    data.requestId.length > 0
  ) {
    return new HttpError({
      kind: HTTP_ERROR_KINDS.RESPONSE,
      status,
      code: data.code,
      requestId: data.requestId,
      fieldErrors: toFieldErrors(data.fieldErrors)
    })
  }

  return new HttpError({
    kind: status === HTTP_NO_STATUS ? HTTP_ERROR_KINDS.NETWORK : HTTP_ERROR_KINDS.RESPONSE,
    status
  })
}
