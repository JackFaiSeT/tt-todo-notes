import type { DraftKey } from '@shared/contract/notes/ids'
import { ROUTE_PATHS } from '@shared/constants/routes'
import { toNotePath } from '@notes/utils/route'
import type { EditorNavigation } from '../types'

export const useEditorNavigation = (canLeave: () => Promise<boolean>): EditorNavigation => {
  const route = useRoute()
  const router = useRouter()

  let isLeaving = false
  let replacedPath: string | undefined

  const replaceKey = async (key: DraftKey): Promise<void> => {
    const path = toNotePath(key)

    if (route.path === path) {
      return
    }

    replacedPath = path

    try {
      await router.replace(path)
    } finally {
      replacedPath = undefined
    }
  }

  const leave = async (): Promise<void> => {
    isLeaving = true

    try {
      await router.push(ROUTE_PATHS.HOME)
    } finally {
      isLeaving = false
    }
  }

  onBeforeRouteLeave(() => isLeaving || canLeave())

  onBeforeRouteUpdate((to) => to.path === replacedPath || canLeave())

  return { replaceKey, leave }
}
