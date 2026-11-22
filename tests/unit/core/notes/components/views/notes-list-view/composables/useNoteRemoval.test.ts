import { describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { DIALOG_ANSWERS } from '@shared/constants/dialog'
import { NOTIFICATION_KINDS } from '@shared/constants/notifications'
import type { DialogAnswer } from '@shared/stores/types'
import { useModalsStore } from '@shared/stores/useModalsStore'
import { useNotificationsStore } from '@shared/stores/useNotificationsStore'
import { BrowserTimer, TimeClient } from '@shared/services/time'
import { NOTES_KEY } from '@notes/constants'
import { useNoteRemoval } from '@notes/components/views/notes-list-view/composables/useNoteRemoval'
import { NotesAdapter, NotesService } from '@notes/composition'
import { createNotesChannel } from '../../../../../../../factories/editor-session'
import { fakeNotesApi } from '../../../../../../../factories/notes-api'
import { stubNuxtApp } from '../../../../../../../factories/nuxt-app'
import { createDraftStorage } from '../../../../../../../factories/storage'
import { createSummary } from '../../../../../../../factories/summaries'

const setup = () => {
  const api = fakeNotesApi()
  const refresh = vi.fn<() => Promise<void>>(async () => undefined)

  const notesService = new NotesService({
    notesApi: api,
    notesAdapter: new NotesAdapter(),
    channelClient: createNotesChannel(),
    ...createDraftStorage()
  })

  stubNuxtApp({
    $services: { [NOTES_KEY]: notesService },
    $timeClient: new TimeClient({ now: () => 0 }, new BrowserTimer())
  })

  setActivePinia(createPinia())

  const { removeNote } = useNoteRemoval({ refresh })

  return { removeNote, remove: api.remove, refresh, modals: useModalsStore(), notifications: useNotificationsStore() }
}

const answer = async (modals: ReturnType<typeof useModalsStore>, result: DialogAnswer) => {
  await Promise.resolve()
  modals.dialogs.at(-1)!.answer(result)
}

describe('Notes/useNoteRemoval', () => {
  it('should keep the note when the removal is declined', async () => {
    const { removeNote, remove, modals } = setup()
    const notes = [createSummary('a'), createSummary('b')]
    const removal = removeNote(notes[0]!, notes)

    await answer(modals, DIALOG_ANSWERS.DECLINE)
    expect(await removal).toBeNull()
    expect(remove).not.toHaveBeenCalled()
  })

  it('should return neighbours of the list seen at confirmation when the list changes during the dialog', async () => {
    const { removeNote, remove, refresh, modals, notifications } = setup()
    const visible = shallowRef([createSummary('a'), createSummary('b')])
    const removal = removeNote(visible.value[0]!, visible)

    visible.value = [createSummary('c'), createSummary('a'), createSummary('b')]
    await answer(modals, DIALOG_ANSWERS.ACCEPT)

    expect(await removal).toEqual([visible.value[2]!.id, visible.value[0]!.id])
    expect(remove).toHaveBeenCalledWith(visible.value[1]!.id)
    expect(refresh).toHaveBeenCalledOnce()
    expect(notifications.notifications.map((item) => item.kind)).toEqual([NOTIFICATION_KINDS.SUCCESS])
  })

  it('should report the failure and return nothing when the request fails', async () => {
    const { removeNote, remove, refresh, modals, notifications } = setup()
    const notes = [createSummary('a')]

    remove.mockRejectedValueOnce(new Error('Нет связи'))

    const removal = removeNote(notes[0]!, notes)

    await answer(modals, DIALOG_ANSWERS.ACCEPT)
    expect(await removal).toBeNull()
    expect(refresh).not.toHaveBeenCalled()
    expect(notifications.notifications.map((item) => item.kind)).toEqual([NOTIFICATION_KINDS.ERROR])
  })
})
