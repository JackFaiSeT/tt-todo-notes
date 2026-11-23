import { FONT_LOAD_SAMPLE, FONT_LOAD_TIMEOUT_MS, PRELOADED_FONT_FACES } from '@shared/constants/fonts'

export const loadFonts = async (): Promise<void> => {
  let timer: ReturnType<typeof setTimeout> | undefined

  const deadline = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, FONT_LOAD_TIMEOUT_MS)
  })

  const faces = Promise.allSettled(PRELOADED_FONT_FACES.map((face) => document.fonts.load(face, FONT_LOAD_SAMPLE)))

  try {
    await Promise.race([faces, deadline])
  } finally {
    clearTimeout(timer)
  }
}
