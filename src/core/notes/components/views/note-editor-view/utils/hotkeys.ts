import { KEYBOARD_CODE_LETTERS, KEYBOARD_LETTERS, LATIN_LETTER_PATTERN } from '@uikit/constants/keyboard'
import { HISTORY_DIRECTIONS } from '@notes/constants'
import type { NNotes } from '@notes/domain'
import { HISTORY_INPUT_DIRECTIONS } from '../constants'

const toLetter = (event: KeyboardEvent): string | undefined =>
  LATIN_LETTER_PATTERN.test(event.key) ? event.key.toLowerCase() : KEYBOARD_CODE_LETTERS[event.code]

export const toHotkeyDirection = (event: KeyboardEvent): NNotes.HistoryDirection | null => {
  if (event.isComposing || event.altKey || !(event.ctrlKey || event.metaKey)) {
    return null
  }

  const letter = toLetter(event)
  const isRedoKey = event.ctrlKey && letter === KEYBOARD_LETTERS.Y && !event.shiftKey

  if (letter !== KEYBOARD_LETTERS.Z && !isRedoKey) {
    return null
  }

  return event.shiftKey || isRedoKey ? HISTORY_DIRECTIONS.REDO : HISTORY_DIRECTIONS.UNDO
}

export const toInputDirection = (event: InputEvent): NNotes.HistoryDirection | null =>
  event.isComposing ? null : (HISTORY_INPUT_DIRECTIONS[event.inputType] ?? null)
