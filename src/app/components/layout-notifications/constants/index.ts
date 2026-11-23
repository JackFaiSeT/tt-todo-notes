import { NOTIFICATION_KINDS } from '@shared/constants/notifications'

export const LAYOUT_NOTIFICATIONS_TEXTS = {
  DISMISS: (text: string): string => `Закрыть сообщение «${text}»`
} as const

export const NOTIFICATION_ICONS = {
  [NOTIFICATION_KINDS.SUCCESS]: 'check',
  [NOTIFICATION_KINDS.ERROR]: 'alert'
} as const
