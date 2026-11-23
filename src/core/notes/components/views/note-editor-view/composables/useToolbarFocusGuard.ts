import { useWindowListener } from '@uikit/composables'
import { NOTE_EDITOR_FOCUS_GAP_PX } from '../constants'
import type { NoteEditorToolbarHandle } from '../components/note-editor-toolbar/types'

export const useToolbarFocusGuard = (): void => {
  const toolbar = useTemplateRef<NoteEditorToolbarHandle>('toolbar')

  let frame: number | undefined

  const revealBelowToolbar = (target: HTMLElement): void => {
    const handle = toValue(toolbar)
    const bottom = handle?.getBottom()

    if (!handle || bottom === undefined || handle.contains(target)) {
      return
    }

    const { top } = target.getBoundingClientRect()

    if (top < bottom) {
      window.scrollBy({ top: top - bottom - NOTE_EDITOR_FOCUS_GAP_PX })
    }
  }

  const handleFocusIn = (event: FocusEvent): void => {
    const { target } = event

    if (!(target instanceof HTMLElement)) {
      return
    }

    revealBelowToolbar(target)

    if (frame !== undefined) {
      cancelAnimationFrame(frame)
    }

    frame = requestAnimationFrame(() => {
      frame = undefined
      revealBelowToolbar(target)
    })
  }

  useWindowListener({ type: 'focusin', handler: handleFocusIn })

  onBeforeUnmount(() => {
    if (frame !== undefined) {
      cancelAnimationFrame(frame)
    }
  })
}
