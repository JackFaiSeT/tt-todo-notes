import { hideLeavingElement } from './hide-leaving-element'

export const detachLeavingElement = (element: Element): void => {
  if (!(element instanceof HTMLElement)) {
    return
  }

  const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = element

  hideLeavingElement(element)
  element.style.top = `${offsetTop}px`
  element.style.left = `${offsetLeft}px`
  element.style.width = `${offsetWidth}px`
  element.style.height = `${offsetHeight}px`
}
