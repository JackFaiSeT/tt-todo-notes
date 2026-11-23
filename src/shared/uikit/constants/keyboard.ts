export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  BACKSPACE: 'Backspace',
  ESCAPE: 'Escape',
  TAB: 'Tab'
} as const

export const KEYBOARD_CODES = {
  KEY_Z: 'KeyZ',
  KEY_Y: 'KeyY'
} as const

export const KEYBOARD_LETTERS = {
  Z: 'z',
  Y: 'y'
} as const

export const KEYBOARD_CODE_LETTERS: Readonly<Record<string, string>> = {
  [KEYBOARD_CODES.KEY_Z]: KEYBOARD_LETTERS.Z,
  [KEYBOARD_CODES.KEY_Y]: KEYBOARD_LETTERS.Y
}

export const LATIN_LETTER_PATTERN = /^[a-z]$/iu
