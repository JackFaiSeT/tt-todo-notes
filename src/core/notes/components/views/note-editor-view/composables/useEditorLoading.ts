import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import type { DraftKey } from '@shared/contract/notes/ids'
import { EDITOR_STATUSES } from '@notes/constants'
import type { EditorLoadingOptions, EditorLoadOptions } from '../types'

export type UseEditorLoadingResult = {
  load: (key: DraftKey, options: EditorLoadOptions) => Promise<void>
}

export const useEditorLoading = ({
  session,
  focus,
  offerDraft,
  reserveOffer,
  whenShown
}: EditorLoadingOptions): UseEditorLoadingResult => {
  const { editor } = session

  const load = async (key: DraftKey, { shouldFocusHeading }: EditorLoadOptions): Promise<void> => {
    await session.open(key)

    const token = editor.captureSession()

    if (toValue(session.candidate)) {
      reserveOffer()
    }

    await whenShown()

    if (key !== editor.key || !token.isCurrent()) {
      return
    }

    if (toValue(session.candidate)) {
      await offerDraft()

      return
    }

    await nextTick()

    if (key === NEW_DRAFT_KEY && editor.status === EDITOR_STATUSES.READY) {
      focus.focusTitle()

      return
    }

    if (shouldFocusHeading) {
      focus.focusHeading()
    }
  }

  return { load }
}
