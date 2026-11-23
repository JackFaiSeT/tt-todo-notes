import type { ErrorCode, ErrorEnvelope, HttpStatus } from '@shared/contract/http'
import { API_ERROR_NAME } from './messages'

type ApiErrorOptions = {
  status: HttpStatus
  code: ErrorCode
  message: string
  cause?: unknown
  details?: ErrorEnvelope['details']
  fieldErrors?: ErrorEnvelope['fieldErrors']
}

export class ApiError extends Error {
  readonly status: HttpStatus

  readonly code: ErrorCode

  readonly details: ErrorEnvelope['details']

  readonly fieldErrors: ErrorEnvelope['fieldErrors']

  constructor(options: ApiErrorOptions) {
    super(options.message, { cause: options.cause })

    this.name = API_ERROR_NAME
    this.status = options.status
    this.code = options.code
    this.details = options.details
    this.fieldErrors = options.fieldErrors
  }
}
