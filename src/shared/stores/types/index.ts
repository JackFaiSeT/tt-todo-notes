import type { ValueOf } from '@shared/contract/types'
import type { DIALOG_ANSWERS } from '@shared/constants/dialog'
import type { NOTIFICATION_KINDS } from '@shared/constants/notifications'

export type DialogAnswer = ValueOf<typeof DIALOG_ANSWERS>

export type DialogOptions = {
  title: string
  description: string
  acceptText: string
  declineText?: string
  isDanger?: boolean
  isAcceptDisabled?: boolean
}

export type Dialog = DialogOptions & {
  id: number
  answer: (answer: DialogAnswer) => void
}

export type ModalsStore = {
  dialogs: Readonly<ShallowRef<Dialog[]>>
  focusedDialogId: Readonly<ShallowRef<number>>
  hasDialogs: ComputedRef<boolean>
  isBackgroundInert: ComputedRef<boolean>
  choose: (options: DialogOptions) => Promise<DialogAnswer>
  confirm: (options: DialogOptions) => Promise<boolean>
  markFocused: (id: number) => void
  dismissAll: () => void
}

export type NotificationKind = ValueOf<typeof NOTIFICATION_KINDS>

export type Notification = {
  id: number
  kind: NotificationKind
  text: string
}

export type NotificationsStore = {
  notifications: Readonly<ShallowRef<Notification[]>>
  success: (text: string) => void
  error: (text: string) => void
  dismiss: (id: number) => void
  pause: () => void
  resume: () => void
}
