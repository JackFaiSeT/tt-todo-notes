import { NOTIFICATION_DURATIONS_MS, NOTIFICATION_KINDS, NOTIFICATIONS_LIMIT } from '@shared/constants/notifications'
import { SHARED_KEY } from '@shared/constants/store-keys'
import { useTimeClient } from '@shared/composables'
import { createStoreId } from '@shared/utils/store-id'
import type { CancelTimer } from '@shared/services/time'
import type { Notification, NotificationKind, NotificationsStore } from './types'

export const NOTIFICATIONS_STORE_ID = createStoreId(SHARED_KEY, 'notifications')

export const useNotificationsStore = defineStore(NOTIFICATIONS_STORE_ID, (): NotificationsStore => {
  const timeClient = useTimeClient()
  const timers = new Map<number, CancelTimer>()

  let lastId = 0

  let isPaused = false

  const notifications = shallowRef<Notification[]>([])

  const dismiss = (id: number): void => {
    timers.get(id)?.()
    timers.delete(id)
    notifications.value = toValue(notifications).filter((notification) => notification.id !== id)
  }

  const schedule = ({ id, kind }: Notification): void => {
    timers.get(id)?.()

    timers.set(
      id,
      timeClient.after(NOTIFICATION_DURATIONS_MS[kind], () => dismiss(id))
    )
  }

  const pause = (): void => {
    isPaused = true

    for (const cancel of timers.values()) {
      cancel()
    }

    timers.clear()
  }

  const resume = (): void => {
    isPaused = false

    for (const notification of toValue(notifications)) {
      schedule(notification)
    }
  }

  const push = (kind: NotificationKind, text: string): void => {
    for (const notification of toValue(notifications).filter((item) => item.text === text)) {
      dismiss(notification.id)
    }

    const overflow = toValue(notifications).length - NOTIFICATIONS_LIMIT + 1

    for (const notification of toValue(notifications).slice(0, Math.max(0, overflow))) {
      dismiss(notification.id)
    }

    const notification = { id: ++lastId, kind, text }

    notifications.value = [...toValue(notifications), notification]

    if (!isPaused) {
      schedule(notification)
    }
  }

  const success = (text: string): void => push(NOTIFICATION_KINDS.SUCCESS, text)

  const error = (text: string): void => push(NOTIFICATION_KINDS.ERROR, text)

  return { notifications: shallowReadonly(notifications), success, error, dismiss, pause, resume }
})
