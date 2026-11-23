import type { TemplateRef } from 'vue'
import { KEYBOARD_KEYS } from '@uikit/constants/keyboard'
import { useWindowListener } from '@uikit/composables'
import { findInitialFocus, findTabTarget } from '../utils/focusables'
import type { FocusTrapOptions } from '../types'

export const useFocusTrap = (
  panel: TemplateRef<HTMLElement>,
  { isTop, onDismiss, onFocused }: FocusTrapOptions
): void => {
  let opener: HTMLElement | null = null
  let shouldRestoreFocus = false

  const focusInitial = (): void => {
    findInitialFocus(toValue(panel))?.focus()
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    if (!isTop()) {
      return
    }

    if (event.key === KEYBOARD_KEYS.ESCAPE) {
      event.preventDefault()
      event.stopImmediatePropagation()
      onDismiss()

      return
    }

    if (event.key !== KEYBOARD_KEYS.TAB) {
      return
    }

    event.preventDefault()
    findTabTarget(toValue(panel), event.shiftKey)?.focus()
  }

  const onFocusIn = (event: FocusEvent): void => {
    if (isTop() && event.target instanceof Node && !toValue(panel)?.contains(event.target)) {
      focusInitial()
    }
  }

  useWindowListener({ type: 'keydown', handler: handleKeydown, isCapture: true })
  useWindowListener({ type: 'focusin', handler: onFocusIn, isCapture: true })

  onMounted(() => {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null

    if (isTop()) {
      focusInitial()
      onFocused()
    }
  })

  onBeforeUnmount(() => {
    shouldRestoreFocus = isTop()
  })

  onUnmounted(() => {
    if (shouldRestoreFocus && opener?.isConnected) {
      opener.focus()
    }
  })
}
