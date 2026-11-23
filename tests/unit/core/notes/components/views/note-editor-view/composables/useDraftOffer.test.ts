import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { computed, effectScope, shallowRef } from 'vue'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import { DIALOG_ANSWERS } from '@shared/constants/dialog'
import { useModalsStore } from '@shared/stores/useModalsStore'
import type { NNotes } from '@notes/domain'
import type { EditorFocus, EditorNavigation } from '@notes/components/views/note-editor-view/types'
import { useDraftOffer } from '@notes/components/views/note-editor-view/composables/useDraftOffer'
import { createEditorScenario } from '../../../../../../../factories/editor-session'

const setup = () => {
  const { actions, editor, report, api } = createEditorScenario()
  const scope = effectScope()
  const candidate = shallowRef<NNotes.DraftCandidate | null>(null)

  const focus = {
    focusTitle: vi.fn<EditorFocus['focusTitle']>(),
    focusHeading: vi.fn<EditorFocus['focusHeading']>(),
    focusRow: vi.fn<EditorFocus['focusRow']>(),
    getFocusedRowId: vi.fn<EditorFocus['getFocusedRowId']>()
  }

  const navigation = {
    replaceKey: vi.fn<EditorNavigation['replaceKey']>(async () => undefined),
    leave: vi.fn<EditorNavigation['leave']>(async () => undefined)
  }

  const session = { ...actions, editor, report, candidate: computed(() => candidate.value) }

  const offer = scope.run(() =>
    useDraftOffer({ session, focus, navigation, announce: vi.fn<(text: string) => void>() })
  )!

  onTestFinished(() => scope.stop())

  return { offer, actions, editor, api, candidate, dialogs: useModalsStore() }
}

const titled = (title: string): NNotes.Draft => ({
  noteId: null,
  baseVersion: null,
  content: { title, todos: [] },
  history: { undo: [], redo: [] },
  savedAt: 1
})

const toCandidate = (draft: NNotes.Draft): NNotes.DraftCandidate => ({
  draft,
  recovery: { key: NEW_DRAFT_KEY, baseVersion: null, hasConflict: false }
})

describe('Notes/useDraftOffer', () => {
  it('should delete the stored draft when the user declines it', async () => {
    const { offer, actions, editor, api, candidate, dialogs } = setup()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)
    editor.inputTitle('Черновик')
    await actions.flushDraft()
    await actions.open(NEW_DRAFT_KEY)
    candidate.value = toCandidate(titled('Черновик'))

    const answering = offer.handleOfferDraft()

    await vi.waitFor(() => expect(dialogs.hasDialogs).toBe(true))
    dialogs.dialogs[0]!.answer(DIALOG_ANSWERS.DECLINE)
    await answering
    expect(await api.draft(NEW_DRAFT_KEY)).toBeNull()
    expect(editor.content.title).toBe('')
  })

  it('should ignore the answer when another note was opened while the dialog was shown', async () => {
    const { offer, actions, editor, candidate, dialogs } = setup()

    await actions.open(NEW_DRAFT_KEY)
    candidate.value = toCandidate(titled('Черновик'))

    const answering = offer.handleOfferDraft()

    await vi.waitFor(() => expect(dialogs.hasDialogs).toBe(true))
    editor.openSession(parseNoteId('other'))
    editor.applyLoaded(null, null)
    dialogs.dialogs[0]!.answer(DIALOG_ANSWERS.ACCEPT)
    await answering
    expect(editor.content.title).toBe('')
  })
})
