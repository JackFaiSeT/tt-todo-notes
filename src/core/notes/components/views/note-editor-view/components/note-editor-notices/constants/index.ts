import { ERROR_CODES } from '@shared/contract/http'
import { NOTES_ERROR_TEXTS } from '@notes/constants'

export const NOTE_EDITOR_NOTICE_TEXTS = {
  DELETED: 'Заметка удалена в другой вкладке.',
  SAVE_COPY: 'Сохранить как новую',
  CONFLICT: NOTES_ERROR_TEXTS[ERROR_CODES.VERSION_CONFLICT],
  DRAFT_AVAILABLE: (savedAt: string): string =>
    `Есть черновик от ${savedAt}. Пока вы его не восстановите или не удалите, новые правки хранятся в этой вкладке.`,
  OPEN_DRAFT: 'Открыть черновик',
  DROP_DRAFT: 'Удалить черновик'
} as const
