export type WindowListener<TType extends keyof WindowEventMap> = {
  type: TType
  handler: (event: WindowEventMap[TType]) => void
  isCapture?: boolean
}

export const useWindowListener = <TType extends keyof WindowEventMap>({
  type,
  handler,
  isCapture = false
}: WindowListener<TType>): void => {
  onMounted(() => {
    window.addEventListener(type, handler, isCapture)
  })

  onBeforeUnmount(() => {
    window.removeEventListener(type, handler, isCapture)
  })
}
