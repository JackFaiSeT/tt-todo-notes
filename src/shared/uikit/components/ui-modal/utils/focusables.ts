import { UI_MODAL_FOCUSABLE_SELECTOR, UI_MODAL_INITIAL_FOCUS_ATTRIBUTE } from '../constants'

const toTabOrder = (element: HTMLElement): number => (element.tabIndex > 0 ? element.tabIndex : Number.MAX_SAFE_INTEGER)

const isReachable = (element: HTMLElement): boolean =>
  !element.matches(':disabled') &&
  (!element.hasAttribute('tabindex') || element.tabIndex >= 0) &&
  !element.closest('[inert]') &&
  element.getClientRects().length > 0 &&
  getComputedStyle(element).visibility === 'visible'

export const findFocusables = (root: HTMLElement | null): HTMLElement[] =>
  Array.from(root?.querySelectorAll<HTMLElement>(UI_MODAL_FOCUSABLE_SELECTOR) ?? [])
    .filter(isReachable)
    .sort((left, right) => toTabOrder(left) - toTabOrder(right))

export const findInitialFocus = (root: HTMLElement | null): HTMLElement | null => {
  const focusables = findFocusables(root)

  return focusables.find((element) => element.hasAttribute(UI_MODAL_INITIAL_FOCUS_ATTRIBUTE)) ?? focusables[0] ?? root
}

export const findTabTarget = (root: HTMLElement | null, isBackward: boolean): HTMLElement | null => {
  const focusables = findFocusables(root)
  const active = document.activeElement
  const index = active instanceof HTMLElement ? focusables.indexOf(active) : -1

  if (index < 0) {
    return (isBackward ? focusables.at(-1) : focusables[0]) ?? root
  }

  const step = isBackward ? -1 : 1

  return focusables[(index + step + focusables.length) % focusables.length] ?? root
}
