import { EDITOR_STATUSES } from '@notes/constants'
import type { NNotes } from '@notes/domain'
import { HISTORY_ANNOUNCEMENTS } from '../constants'
import type { EditorHistoryOptions } from '../types'
import { useHistoryHotkeys } from './useHistoryHotkeys'

export type UseEditorHistoryResult = {
  handleStep: (direction: NNotes.HistoryDirection) => Promise<void>
}

export const useEditorHistory = ({ editor, focus, announce }: EditorHistoryOptions): UseEditorHistoryResult => {
  const handleStep = async (direction: NNotes.HistoryDirection): Promise<void> => {
    if (editor.status !== EDITOR_STATUSES.READY || editor.isBusy) {
      return
    }

    const focusedId = focus.getFocusedRowId()
    const focusedIndex = editor.content.todos.findIndex((todo) => todo.id === focusedId)

    if (!editor.stepHistory(direction)) {
      return
    }

    announce(HISTORY_ANNOUNCEMENTS[direction])

    const { todos } = editor.content

    if (focusedId && !todos.some((todo) => todo.id === focusedId)) {
      await nextTick()
      focus.focusRow(todos[Math.min(focusedIndex, todos.length - 1)]?.id)
    }
  }

  useHistoryHotkeys((direction) => void handleStep(direction))

  return { handleStep }
}
