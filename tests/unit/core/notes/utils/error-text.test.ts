import { describe, it, expect } from 'vitest'
import { ERROR_CODES, HTTP_STATUS } from '@shared/contract/http'
import { HTTP_ERROR_KINDS } from '@shared/constants/http'
import { HttpError } from '@shared/services/http'
import { NOTES_ERROR_TEXTS, NOTES_FAILURE_TEXTS } from '@notes/constants'
import { toNotesErrorText } from '@notes/utils/error-text'
import { NotesError } from '@notes/errors'

const PRIVATE_TEXT = 'private server diagnostic'

const cause = new Error(PRIVATE_TEXT)

const responseError = new HttpError({
  kind: HTTP_ERROR_KINDS.RESPONSE,
  status: HTTP_STATUS.CONFLICT,
  code: ERROR_CODES.VERSION_CONFLICT
})

describe('Notes/toNotesErrorText', () => {
  it.each([
    ['a domain error', new NotesError(ERROR_CODES.DRAFT_UNREADABLE, cause), NOTES_ERROR_TEXTS.DRAFT_UNREADABLE],
    ['a server error code', responseError, NOTES_ERROR_TEXTS.VERSION_CONFLICT],
    ['a lost connection', new HttpError({ kind: HTTP_ERROR_KINDS.NETWORK, status: 0 }), NOTES_FAILURE_TEXTS.NETWORK],
    ['a wrapped server error', new Error(PRIVATE_TEXT, { cause: responseError }), NOTES_ERROR_TEXTS.VERSION_CONFLICT],
    ['an unknown failure', cause, NOTES_FAILURE_TEXTS.UNKNOWN]
  ])('should show a local message when the failure is %s', (_case, error, expected) => {
    const text = toNotesErrorText(error)

    expect(text).toBe(expected)
    expect(text).not.toContain(PRIVATE_TEXT)
  })

  it('should add the request code when the server fails to handle the request', () => {
    const failure = new HttpError({
      kind: HTTP_ERROR_KINDS.RESPONSE,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      requestId: 'req-42'
    })

    expect(toNotesErrorText(new NotesError(ERROR_CODES.INTERNAL_ERROR, failure))).toBe(
      NOTES_ERROR_TEXTS.INTERNAL_ERROR + ' Код запроса: req-42.'
    )
  })

  it('should not add the request code when the request itself was rejected', () => {
    const rejected = new HttpError({
      kind: HTTP_ERROR_KINDS.RESPONSE,
      status: HTTP_STATUS.CONFLICT,
      code: ERROR_CODES.VERSION_CONFLICT,
      requestId: 'req-43'
    })

    expect(toNotesErrorText(rejected)).toBe(NOTES_ERROR_TEXTS.VERSION_CONFLICT)
  })
})
