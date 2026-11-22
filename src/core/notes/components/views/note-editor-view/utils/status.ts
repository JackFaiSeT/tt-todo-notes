import { formatTime } from '@shared/utils/format-date'
import { EDITOR_STATUSES } from '@notes/constants'
import type { EditorSession } from '@notes/stores/useEditorStore'
import type { NNotes } from '@notes/domain'
import { NOTE_EDITOR_FALLBACK_STATUSES, NOTE_EDITOR_STATUS_TEXTS } from '../constants'

export const isLoadingStatus = (status: NNotes.EditorStatus): boolean =>
  status !== EDITOR_STATUSES.READY && !NOTE_EDITOR_FALLBACK_STATUSES.includes(status)

export const toStatusText = (editor: Pick<EditorSession, 'isDirty' | 'base'>): string => {
  if (editor.isDirty) {
    return NOTE_EDITOR_STATUS_TEXTS.DIRTY
  }

  return editor.base
    ? NOTE_EDITOR_STATUS_TEXTS.SAVED_AT(formatTime(editor.base.updatedAt))
    : NOTE_EDITOR_STATUS_TEXTS.NEW
}
