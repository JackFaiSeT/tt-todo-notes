import { HTTP_STATUS } from '@shared/contract/http'
import { HTTP_ERROR_KINDS } from '@shared/constants/http'
import { isHttpError } from '@shared/services/http'
import { NOTES_ERROR_TEXTS, NOTES_FAILURE_TEXTS } from '@notes/constants'
import { isNotesError } from '@notes/errors'

const toServerRequestId = (error: unknown): string | undefined => {
  if (isHttpError(error)) {
    return error.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR ? error.requestId : undefined
  }

  return error instanceof Error ? toServerRequestId(error.cause) : undefined
}

const toBaseText = (error: unknown): string => {
  if (isNotesError(error)) {
    return NOTES_ERROR_TEXTS[error.code]
  }

  if (isHttpError(error) && error.code) {
    return NOTES_ERROR_TEXTS[error.code]
  }

  if (isHttpError(error) && error.kind === HTTP_ERROR_KINDS.NETWORK) {
    return NOTES_FAILURE_TEXTS.NETWORK
  }

  if (error instanceof Error && (isNotesError(error.cause) || isHttpError(error.cause))) {
    return toBaseText(error.cause)
  }

  return NOTES_FAILURE_TEXTS.UNKNOWN
}

export const toNotesErrorText = (error: unknown): string => {
  const requestId = toServerRequestId(error)

  return toBaseText(error) + (requestId ? NOTES_FAILURE_TEXTS.REQUEST_ID(requestId) : '')
}
