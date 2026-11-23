import { HTTP_ERROR_KINDS } from '@shared/constants/http'
import { isHttpError } from '@shared/services/http'
import { NotesError } from '@notes/errors'

export const withNotesErrors = async <TResult>(request: () => Promise<TResult>): Promise<TResult> => {
  try {
    return await request()
  } catch (error) {
    if (isHttpError(error) && error.kind === HTTP_ERROR_KINDS.RESPONSE && error.code) {
      throw new NotesError(error.code, error)
    }

    throw error
  }
}
