const LOCKED_OVERFLOW = 'hidden'

export const useScrollLock = (isLocked: MaybeRefOrGetter<boolean>): void => {
  watch(
    () => toValue(isLocked),
    (shouldLock) => {
      if (!shouldLock) {
        return
      }

      const root = document.documentElement
      const { overflow, paddingRight } = root.style
      const scrollbarWidth = window.innerWidth - root.clientWidth

      root.style.overflow = LOCKED_OVERFLOW
      root.style.paddingRight = `${scrollbarWidth}px`

      onWatcherCleanup(() => {
        root.style.overflow = overflow
        root.style.paddingRight = paddingRight
      })
    }
  )
}
