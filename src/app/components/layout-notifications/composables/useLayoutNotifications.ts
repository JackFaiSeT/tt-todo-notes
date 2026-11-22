import { NOTIFICATION_KINDS } from '@shared/constants/notifications'
import { usePageLifecycle } from '@shared/composables'
import type { Notification, NotificationKind } from '@shared/stores/types'
import { useModalsStore } from '@shared/stores/useModalsStore'
import { useNotificationsStore } from '@shared/stores/useNotificationsStore'

export type UseLayoutNotificationsResult = {
  notifications: Ref<Notification[]>
  latestStatus: ComputedRef<Notification | undefined>
  latestAlert: ComputedRef<Notification | undefined>
  isInert: Ref<boolean>
  handleDismiss: (id: number) => void
  handlePointerEnter: () => void
  handlePointerLeave: () => void
  handleFocusIn: () => void
  handleFocusOut: (event: FocusEvent) => void
}

export const useLayoutNotifications = (): UseLayoutNotificationsResult => {
  const store = useNotificationsStore()
  const pageLifecycle = usePageLifecycle()
  const { notifications } = storeToRefs(store)
  const { isBackgroundInert: isInert } = storeToRefs(useModalsStore())

  const isPointerInside = shallowRef<boolean>(false)
  const isFocusInside = shallowRef<boolean>(false)
  const isPageHidden = shallowRef<boolean>(false)

  const toLatest = (kind: NotificationKind): Notification | undefined =>
    toValue(notifications).findLast((notification) => notification.kind === kind)

  const latestStatus = computed<Notification | undefined>(() => toLatest(NOTIFICATION_KINDS.SUCCESS))

  const latestAlert = computed<Notification | undefined>(() => toLatest(NOTIFICATION_KINDS.ERROR))

  const isHeld = computed<boolean>(() => toValue(isPointerInside) || toValue(isFocusInside) || toValue(isPageHidden))

  const handlePointerEnter = (): void => {
    isPointerInside.value = true
  }

  const handlePointerLeave = (): void => {
    isPointerInside.value = false
  }

  const handleFocusIn = (): void => {
    isFocusInside.value = true
  }

  const handleFocusOut = (event: FocusEvent): void => {
    const list = event.currentTarget instanceof Element ? event.currentTarget : null

    isFocusInside.value = Boolean(list && event.relatedTarget instanceof Node && list.contains(event.relatedTarget))
  }

  const stopHide = pageLifecycle.onHide(() => {
    isPageHidden.value = true
  })

  const stopResume = pageLifecycle.onResume(() => {
    isPageHidden.value = false
  })

  watch(isHeld, (isHeldNow) => (isHeldNow ? store.pause() : store.resume()))

  onScopeDispose(() => {
    stopHide()
    stopResume()
  })

  return {
    notifications,
    latestStatus,
    latestAlert,
    isInert,
    handleDismiss: store.dismiss,
    handlePointerEnter,
    handlePointerLeave,
    handleFocusIn,
    handleFocusOut
  }
}
