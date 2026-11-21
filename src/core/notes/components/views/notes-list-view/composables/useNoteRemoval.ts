import type { NoteId } from '@shared/contract/notes/ids'
import { useModalsStore } from '@shared/stores/useModalsStore'
import { useNotificationsStore } from '@shared/stores/useNotificationsStore'
import { useNotesService } from '@notes/composables'
import { toNotesErrorText } from '@notes/utils/error-text'
import type { NNotes } from '@notes/domain'
import { NOTES_LIST_TEXTS } from '../constants'
import { toNeighborIds, toRemovalDialog } from '../utils'
import type { NoteRemovalOptions } from '../types'

export type UseNoteRemovalResult = {
  removeNote: (note: NNotes.Summary, visibleNotes: MaybeRefOrGetter<NNotes.Summary[]>) => Promise<NoteId[] | null>
}

export const useNoteRemoval = ({ refresh }: NoteRemovalOptions): UseNoteRemovalResult => {
  const notesService = useNotesService()
  const modals = useModalsStore()
  const notifications = useNotificationsStore()

  const removeNote = async (
    note: NNotes.Summary,
    visibleNotes: MaybeRefOrGetter<NNotes.Summary[]>
  ): Promise<NoteId[] | null> => {
    if (!(await modals.confirm(toRemovalDialog(note)))) {
      return null
    }

    const neighborIds = toNeighborIds(toValue(visibleNotes), note.id)

    try {
      await notesService.remove(note.id)
      await refresh()
    } catch (error) {
      notifications.error(toNotesErrorText(error))

      return null
    }

    notifications.success(NOTES_LIST_TEXTS.REMOVED)

    return neighborIds
  }

  return { removeNote }
}
