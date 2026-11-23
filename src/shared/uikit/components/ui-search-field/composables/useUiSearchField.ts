import { KEYBOARD_KEYS } from '@uikit/constants/keyboard'

export type UseUiSearchFieldResult = {
  handleKeydown: (event: KeyboardEvent) => void
  handleClear: () => void
  focus: () => void
}

export const useUiSearchField = (query: Ref<string>): UseUiSearchFieldResult => {
  const input = useTemplateRef<HTMLInputElement>('input')

  const focus = (): void => toValue(input)?.focus()

  const handleClear = (): void => {
    query.value = ''
    focus()
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === KEYBOARD_KEYS.ESCAPE && toValue(query)) {
      event.preventDefault()
      handleClear()
    }
  }

  return { handleKeydown, handleClear, focus }
}
