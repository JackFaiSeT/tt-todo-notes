import type { UiStatusScreenHandle } from '../types'

export type UseUiStatusScreenResult = UiStatusScreenHandle

export const useUiStatusScreen = (): UseUiStatusScreenResult => {
  const heading = useTemplateRef<HTMLElement>('heading')

  const focus = (): void => toValue(heading)?.focus()

  return { focus }
}
