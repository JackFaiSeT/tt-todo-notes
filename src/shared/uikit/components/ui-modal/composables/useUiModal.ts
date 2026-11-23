import type { EmitFn } from 'vue'
import type { Emits, Props } from '../types'
import { useFocusTrap } from './useFocusTrap'

export type UseUiModalResult = {
  titleId: string
  descriptionId: string
  handleDismiss: () => void
}

export const useUiModal = (props: Props, emit: EmitFn<Emits>): UseUiModalResult => {
  const panel = useTemplateRef<HTMLElement>('panel')

  const handleDismiss = (): void => emit('dismiss')

  useFocusTrap(panel, {
    isTop: () => props.isTop,
    onDismiss: handleDismiss,
    onFocused: () => emit('focused')
  })

  return { titleId: useId(), descriptionId: useId(), handleDismiss }
}
