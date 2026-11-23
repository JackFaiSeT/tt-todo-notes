import { useWindowListener } from '@uikit/composables'
import { useModalsStore } from '@shared/stores/useModalsStore'
import type { NNotes } from '@notes/domain'
import { toHotkeyDirection, toInputDirection } from '../utils'

export const useHistoryHotkeys = (step: (direction: NNotes.HistoryDirection) => void): void => {
  const modals = useModalsStore()

  const stepOutsideDialogs = (direction: NNotes.HistoryDirection): void => {
    if (!modals.hasDialogs) {
      step(direction)
    }
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    const direction = toHotkeyDirection(event)

    if (!direction) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    stepOutsideDialogs(direction)
  }

  const handleBeforeInput = (event: InputEvent): void => {
    const direction = toInputDirection(event)

    if (!direction) {
      return
    }

    event.preventDefault()
    stepOutsideDialogs(direction)
  }

  useWindowListener({ type: 'keydown', handler: handleKeydown, isCapture: true })
  useWindowListener({ type: 'beforeinput', handler: handleBeforeInput, isCapture: true })
}
