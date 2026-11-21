import type { ValueOf } from '@shared/contract/types'
import type { UI_MODAL_ROLES } from '../constants'

export type UiModalRole = ValueOf<typeof UI_MODAL_ROLES>

export type Props = {
  role: UiModalRole
  title: string
  description: string
  isInert: boolean
  isTop: boolean
}

export type Emits = {
  dismiss: []
  focused: []
}

export type FocusTrapOptions = {
  isTop: () => boolean
  onDismiss: () => void
  onFocused: () => void
}
