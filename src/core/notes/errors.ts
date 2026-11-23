import type { ErrorCode } from '@shared/contract/http'

const NOTES_ERROR_NAME = 'NotesError'

export class NotesError extends Error {
  constructor(
    readonly code: ErrorCode,
    cause: unknown
  ) {
    super(code, { cause })
    this.name = NOTES_ERROR_NAME
  }
}

export const isNotesError = (error: unknown): error is NotesError => error instanceof NotesError

export const hasNotesErrorCode = (error: unknown, code: ErrorCode): error is NotesError =>
  isNotesError(error) && error.code === code
