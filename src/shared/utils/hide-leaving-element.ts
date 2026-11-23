export const hideLeavingElement = (element: Element): void => {
  if (!(element instanceof HTMLElement)) {
    return
  }

  element.inert = true
  element.setAttribute('aria-hidden', 'true')
}
