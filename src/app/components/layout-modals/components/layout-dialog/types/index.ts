import type { Dialog } from '@shared/stores/types'

export type Props = {
  dialog: Dialog
  isInert: boolean
  isTop: boolean
}

export type Emits = {
  focused: [id: number]
}

export type InitialFocusAttrs = Record<string, string>
