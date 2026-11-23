import { ROUTE_PATHS } from '@shared/constants/routes'
import { useModalsStore } from '@shared/stores/useModalsStore'

export type UseDefaultLayoutResult = {
  isBackgroundInert: Ref<boolean>
  skipToContent: (event: MouseEvent) => void
}

export const useDefaultLayout = (): UseDefaultLayoutResult => {
  const route = useRoute()
  const { isBackgroundInert } = storeToRefs(useModalsStore())
  const main = useTemplateRef<HTMLElement>('main')

  const skipToContent = (event: MouseEvent): void => {
    event.preventDefault()
    toValue(main)?.focus()
  }

  watch(
    () => route.path,
    async (path) => {
      if (path === ROUTE_PATHS.HOME) {
        await nextTick()
        toValue(main)?.focus()
      }
    },
    { flush: 'post' }
  )

  return { isBackgroundInert, skipToContent }
}
