import { ApiError } from '#server/common/errors/api-error'
import { ERROR_CODES, HTTP_STATUS } from '@shared/contract/http'
import { DRAFT_NOTE_FIELD, NOTES_ERROR_MESSAGES } from '../constants'

export const noteNotFound = (): ApiError =>
  new ApiError({
    status: HTTP_STATUS.NOT_FOUND,
    code: ERROR_CODES.NOTE_NOT_FOUND,
    message: NOTES_ERROR_MESSAGES.NOT_FOUND
  })

export const versionConflict = (): ApiError =>
  new ApiError({
    status: HTTP_STATUS.CONFLICT,
    code: ERROR_CODES.VERSION_CONFLICT,
    message: NOTES_ERROR_MESSAGES.VERSION_CONFLICT
  })

export const draftUnreadable = (cause: unknown): ApiError =>
  new ApiError({
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ERROR_CODES.DRAFT_UNREADABLE,
    message: NOTES_ERROR_MESSAGES.DRAFT_UNREADABLE,
    cause
  })

export const draftKeyMismatch = (): ApiError =>
  new ApiError({
    status: HTTP_STATUS.BAD_REQUEST,
    code: ERROR_CODES.VALIDATION_FAILED,
    message: NOTES_ERROR_MESSAGES.DRAFT_KEY_MISMATCH,
    details: { field: DRAFT_NOTE_FIELD }
  })
