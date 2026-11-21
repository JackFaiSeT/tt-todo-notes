import type { Props } from '../types'

export type UseUiCheckboxResult = {
  inputId: ComputedRef<string>
}

export const useUiCheckbox = (props: Props): UseUiCheckboxResult => {
  const fallbackId = useId()

  const inputId = computed<string>(() => props.id ?? fallbackId)

  return { inputId }
}
