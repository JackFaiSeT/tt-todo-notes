import type { IconName } from '@base'

export type Props = {
  icon: IconName
  label: string
}

export type Emits = {
  click: [event: MouseEvent]
}
