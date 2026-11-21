import { ICON_PATHS } from '../constants'
import type { Props } from '../types'

export type UseBaseIconResult = {
  path: ComputedRef<string>
}

export const useBaseIcon = (props: Props): UseBaseIconResult => {
  const path = computed<string>(() => ICON_PATHS[props.name])

  return { path }
}
