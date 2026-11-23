import { vi, onTestFinished } from 'vitest'
import { effectScope } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { IdClient } from '@shared/services/ids'
import { TimeClient, BrowserTimer } from '@shared/services/time'
import { useEditorDraftSync, useEditorMutations, useEditorOpening } from '@notes/composables'
import { useEditorStore } from '@notes/stores/useEditorStore'
import type { NNotes } from '@notes/domain'
import { NotesService, NotesAdapter } from '@notes/composition'
import { fakeNotesApi } from './notes-api'
import { stubNuxtApp } from './nuxt-app'
import { createDraftStorage } from './storage'

export const createEditorTestSession = () => {
  const pinia = createPinia()
  const timeClient = new TimeClient({ now: () => 200 }, new BrowserTimer())
  let sequence = 0
  const idClient = new IdClient({ next: () => 'todo-' + ++sequence })

  stubNuxtApp({ $timeClient: timeClient, $idClient: idClient })
  setActivePinia(pinia)

  return { editor: useEditorStore(pinia), timeClient }
}

export const createNotesChannel = () => ({
  publish: vi.fn<(change: NNotes.Change) => void>(),
  subscribe: vi.fn<(handle: NNotes.ChangeHandler) => () => void>(() => () => undefined),
  close: vi.fn<() => void>()
})

export const createEditorScenario = () => {
  const api = fakeNotesApi()
  const channel = createNotesChannel()
  const draftStorage = createDraftStorage()

  const notesService = new NotesService({
    notesApi: api,
    notesAdapter: new NotesAdapter(),
    channelClient: channel,
    ...draftStorage
  })

  const { editor, timeClient } = createEditorTestSession()
  const report = vi.fn<NNotes.ErrorReport>()
  const scope = effectScope()

  const actions = scope.run(() => {
    const draftSync = useEditorDraftSync({ session: editor, notesService, timeClient, report })

    const opening = useEditorOpening({
      session: editor,
      notesService,
      draftSync,
      report,
      loadNote: (key) => (key === NEW_DRAFT_KEY ? Promise.resolve(null) : notesService.get(key)),
      loadDraft: (key) => notesService.draft(key)
    })

    const mutations = useEditorMutations({ session: editor, notesService, draftSync, report })

    return { ...opening, ...draftSync, ...mutations }
  })!

  onTestFinished(() => scope.stop())

  return { actions, editor, service: notesService, api, broadcast: channel.publish, report, ...draftStorage }
}
