import { isEntityId, parseNoteId } from '@shared/contract/notes/ids'
import { CURSOR_SEPARATOR, CURSOR_TIME_PATTERN } from '../constants'
import type { NoteCursor } from '../types'

export const encodeCursor = ({ updatedAt, id }: NoteCursor): string => `${updatedAt}${CURSOR_SEPARATOR}${id}`

export const decodeCursor = (value: string): NoteCursor | null => {
  const separator = value.indexOf(CURSOR_SEPARATOR)
  const time = value.slice(0, separator)
  const id = value.slice(separator + 1)

  if (separator < 0 || !CURSOR_TIME_PATTERN.test(time) || !isEntityId(id)) {
    return null
  }

  const updatedAt = Number(time)

  return Number.isSafeInteger(updatedAt) ? { updatedAt, id: parseNoteId(id) } : null
}
