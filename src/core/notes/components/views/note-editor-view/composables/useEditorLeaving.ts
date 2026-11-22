import { useModalsStore } from '@shared/stores/useModalsStore'
import type { UseNoteEditorResult } from '@notes/composables'
import { EDITOR_DIALOGS } from '../constants/dialogs'

export type UseEditorLeavingResult = {
  canLeave: () => Promise<boolean>
}

export const useEditorLeaving = ({ editor, retainDraft }: UseNoteEditorResult): UseEditorLeavingResult => {
  const modals = useModalsStore()

  const canLeave = async (): Promise<boolean> => {
    if (editor.isBusy) {
      return false
    }

    if (!editor.isDirty) {
      return true
    }

    if (editor.isDeleted) {
      return modals.confirm(EDITOR_DIALOGS.LEAVE_DELETED)
    }

    if (editor.hasCandidate) {
      return modals.confirm(EDITOR_DIALOGS.LEAVE_WITH_DRAFT)
    }

    return (await modals.confirm(EDITOR_DIALOGS.LEAVE)) && retainDraft()
  }

  return { canLeave }
}
