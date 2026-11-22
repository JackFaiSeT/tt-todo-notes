import { ERROR_CODES } from '@shared/contract/http'
import { EDITOR_STATUSES, HISTORY_DIRECTIONS, NOTES_ERROR_TEXTS } from '@notes/constants'
import type { NNotes } from '@notes/domain'

export const NOTE_EDITOR_TEXTS = {
  HEADING_EXISTING: 'Редактирование',
  HEADING_NEW: 'Новая заметка',
  TITLE_LABEL: 'Название',
  ITEMS_TITLE: 'Пункты',
  ADD_ITEM: 'Добавить пункт',
  LOADING: 'Открываем заметку…',
  HINT_INVALID: 'Для сохранения введите название или хотя бы один пункт.',
  HINT_EMPTY_ITEMS: 'Заполните или удалите пустые пункты, чтобы сохранить заметку.',
  DRAFT_POSTPONED: 'Черновик оставлен без изменений',
  HINT_LIMIT: (limit: number): string => `Достигнут предел в ${limit} пунктов.`,
  LIMIT_REACHED: 'Достигнут предел пунктов.',
  CONFLICT: NOTES_ERROR_TEXTS[ERROR_CODES.VERSION_CONFLICT]
} as const

export const NOTE_EDITOR_STATUS_TEXTS = {
  DIRTY: 'Есть несохранённые изменения',
  NEW: 'Новая заметка',
  SAVED_AT: (time: string): string => `Сохранено в ${time}`
} as const

export const NOTE_EDITOR_ELEMENT_IDS = {
  TITLE_INPUT: 'note-title',
  SAVE_HINT: 'save-hint',
  ITEM_LIMIT_HINT: 'item-limit-hint'
} as const

export const NOTE_EDITOR_FALLBACK_STATUSES: readonly NNotes.EditorStatus[] = [
  EDITOR_STATUSES.MISSING,
  EDITOR_STATUSES.ERROR
]

export const NOTE_EDITOR_FOCUS_GAP_PX = 12

export const NOTE_EDITOR_SKELETON_ROWS = {
  DEFAULT: 3,
  MAX: 8
} as const

export const HISTORY_ANNOUNCEMENTS = {
  [HISTORY_DIRECTIONS.UNDO]: 'Действие отменено',
  [HISTORY_DIRECTIONS.REDO]: 'Действие повторено'
} as const

export const HISTORY_INPUT_DIRECTIONS: Readonly<Record<string, NNotes.HistoryDirection>> = {
  historyUndo: HISTORY_DIRECTIONS.UNDO,
  historyRedo: HISTORY_DIRECTIONS.REDO
}

export const NOTE_EDITOR_NOTIFICATIONS = {
  CREATED: 'Заметка создана',
  SAVED: 'Заметка сохранена',
  COPY_SAVED: 'Сохранена копия заметки',
  DELETED: 'Заметка удалена',
  DISCARDED: 'Правки отменены',
  DRAFT_RESTORED: 'Черновик восстановлен',
  DRAFT_DELETED: 'Черновик удалён'
} as const
