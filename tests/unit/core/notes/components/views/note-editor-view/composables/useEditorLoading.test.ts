import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { computed, effectScope } from 'vue'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { EDITOR_STATUSES } from '@notes/constants'
import type { NNotes } from '@notes/domain'
import type { EditorFocus } from '@notes/components/views/note-editor-view/types'
import { useEditorLoading } from '@notes/components/views/note-editor-view/composables/useEditorLoading'
import { createEditorScenario } from '../../../../../../../factories/editor-session'

const pendingDraft: NNotes.DraftCandidate = {
  draft: {
    noteId: null,
    baseVersion: null,
    content: { title: 'Черновик', todos: [] },
    history: { undo: [], redo: [] },
    savedAt: 1
  },
  recovery: { key: NEW_DRAFT_KEY, baseVersion: null, hasConflict: false }
}

const setup = () => {
  const { actions, editor, report } = createEditorScenario()
  const scope = effectScope()
  const offerDraft = vi.fn<() => Promise<void>>(async () => undefined)
  let show = (): void => undefined

  const shown = new Promise<void>((resolve) => {
    show = resolve
  })

  const focus = {
    focusTitle: vi.fn<EditorFocus['focusTitle']>(),
    focusHeading: vi.fn<EditorFocus['focusHeading']>(),
    focusRow: vi.fn<EditorFocus['focusRow']>(),
    getFocusedRowId: vi.fn<EditorFocus['getFocusedRowId']>()
  }

  const session = { ...actions, editor, report, candidate: computed(() => pendingDraft) }

  const { load } = scope.run(() =>
    useEditorLoading({ session, focus, offerDraft, reserveOffer: vi.fn<() => void>(), whenShown: () => shown })
  )!

  onTestFinished(() => scope.stop())

  return { load, actions, editor, offerDraft, focus, show }
}

describe('Notes/useEditorLoading', () => {
  it('should offer the draft when the editor is shown', async () => {
    const { load, offerDraft, show } = setup()
    const loading = load(NEW_DRAFT_KEY, { shouldFocusHeading: true })

    show()
    await loading
    expect(offerDraft).toHaveBeenCalledTimes(1)
  })

  it('should not offer the draft when the editor was left before it was shown', async () => {
    const { load, actions, editor, offerDraft, focus, show } = setup()
    const loading = load(NEW_DRAFT_KEY, { shouldFocusHeading: true })

    await vi.waitFor(() => expect(editor.status).toBe(EDITOR_STATUSES.READY))
    actions.close()
    show()
    await loading
    expect(offerDraft).not.toHaveBeenCalled()
    expect(focus.focusTitle).not.toHaveBeenCalled()
  })
})
