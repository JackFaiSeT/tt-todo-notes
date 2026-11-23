import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { usePageLifecycle, useTimeClient } from '@shared/composables'
import type { StopListening } from '@shared/services/page-lifecycle'
import { NOTES_DATA_KEYS, RESUME_REFRESH_WINDOW_MS } from '@notes/constants'
import type { NNotes } from '@notes/domain'
import { useNotesListCache } from './api'
import { useNotesService } from './useNotesService'

export const useNotesSynchronization = (): StopListening => {
  const nuxtApp = useNuxtApp()
  const notesService = useNotesService()
  const pageLifecycle = usePageLifecycle()
  const timeClient = useTimeClient()
  const listCache = useNotesListCache()

  let lastResumeAt = -Infinity

  const onResume = (): void => {
    const now = timeClient.now()

    if (now - lastResumeAt < RESUME_REFRESH_WINDOW_MS) {
      return
    }

    lastResumeAt = now
    void nuxtApp.runWithContext(() => refreshNuxtData())
  }

  const onChange = ({ id }: NNotes.Change): void => {
    listCache.clear()

    void nuxtApp.runWithContext(() =>
      refreshNuxtData([
        NOTES_DATA_KEYS.list,
        NOTES_DATA_KEYS.note(id),
        NOTES_DATA_KEYS.draft(id),
        NOTES_DATA_KEYS.draft(NEW_DRAFT_KEY)
      ])
    )
  }

  const stopResume = pageLifecycle.onResume(onResume)
  const stopChanges = notesService.subscribe(onChange)

  return () => {
    stopResume()
    stopChanges()
  }
}
