import { NOTE_TEXTS } from '@notes/constants'

export const NOTE_EDITOR_FALLBACK_TEXTS = {
  MISSING_TITLE: NOTE_TEXTS.MISSING,
  MISSING_DESCRIPTION: 'Возможно, её удалили или в адресе ошибка.',
  RESTORE_DRAFT: 'Восстановить черновик',
  ERROR_TITLE: 'Не удалось открыть заметку',
  ERROR_DESCRIPTION: 'Проверьте соединение и попробуйте ещё раз.'
} as const
