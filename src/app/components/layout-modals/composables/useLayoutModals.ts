import { useModalsStore } from '@shared/stores/useModalsStore'
import type { DialogLayer } from '../types'
import { useScrollLock } from './useScrollLock'

export type UseLayoutModalsResult = {
  layers: ComputedRef<DialogLayer[]>
  onFocused: (id: number) => void
}

export const useLayoutModals = (): UseLayoutModalsResult => {
  const route = useRoute()
  const modals = useModalsStore()

  const layers = computed<DialogLayer[]>(() => {
    const stack = modals.dialogs
    const focused = stack.findLast((dialog) => dialog.id <= modals.focusedDialogId)

    return stack.map((dialog) => ({
      dialog,
      isInert: focused !== undefined && dialog.id < focused.id,
      isTop: dialog === stack.at(-1)
    }))
  })

  useScrollLock(() => modals.hasDialogs)

  watch(
    () => route.path,
    () => modals.dismissAll()
  )

  return { layers, onFocused: modals.markFocused }
}
