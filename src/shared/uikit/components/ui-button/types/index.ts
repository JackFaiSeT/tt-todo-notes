import type { ValueOf } from '@shared/contract/types'
import type { UI_BUTTON_VARIANTS } from '../constants'

export type UiButtonVariant = ValueOf<typeof UI_BUTTON_VARIANTS>

export type Props = {
  variant?: UiButtonVariant
  to?: string | undefined
}

export type Emits = {
  click: [event: MouseEvent]
}
