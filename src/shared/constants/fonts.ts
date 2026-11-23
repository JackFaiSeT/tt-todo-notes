export const FONT_FAMILY = 'Roboto'

export const FONT_WEIGHTS = [400, 500, 700] as const

export const PRELOADED_FONT_FACES = FONT_WEIGHTS.map((weight) => `${weight} 1em ${FONT_FAMILY}`)

export const FONT_LOAD_SAMPLE = 'Todo Notes Заметки 0123'

export const FONT_LOAD_TIMEOUT_MS = 1500
