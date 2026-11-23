import { LOADING_MIN_VISIBLE_MS } from '@shared/constants/loading'
import type { CancelTimer } from '@shared/services/time'
import { useTimeClient } from './useTimeClient'

export type UseMinimumPendingResult = {
  isPending: Readonly<ShallowRef<boolean>>
  whenSettled: () => Promise<void>
}

export const useMinimumPending = (source: MaybeRefOrGetter<boolean>): UseMinimumPendingResult => {
  const timeClient = useTimeClient()
  const isPending = shallowRef<boolean>(toValue(source))
  const waiters = new Set<() => void>()

  let startedAt = timeClient.now()
  let cancelTimer: CancelTimer | undefined

  const stopTimer = (): void => {
    cancelTimer?.()
    cancelTimer = undefined
  }

  const settle = (): void => {
    stopTimer()
    isPending.value = false

    for (const resolve of waiters) {
      resolve()
    }

    waiters.clear()
  }

  const whenSettled = (): Promise<void> =>
    toValue(isPending) ? new Promise<void>((resolve) => waiters.add(resolve)) : Promise.resolve()

  watch(
    () => toValue(source),
    (isActive) => {
      stopTimer()

      if (isActive) {
        if (!toValue(isPending)) {
          startedAt = timeClient.now()
          isPending.value = true
        }

        return
      }

      const remaining = startedAt + LOADING_MIN_VISIBLE_MS - timeClient.now()

      if (remaining > 0) {
        cancelTimer = timeClient.after(remaining, settle)
      } else {
        settle()
      }
    }
  )

  if (getCurrentInstance()) {
    onMounted(() => {
      if (toValue(isPending)) {
        startedAt = timeClient.now()
      }
    })
  }

  onScopeDispose(settle)

  return { isPending: shallowReadonly(isPending), whenSettled }
}
