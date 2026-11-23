import type { ICON_PATHS } from '../constants'

export type IconName = keyof typeof ICON_PATHS

export type Props = {
  name: IconName
}
