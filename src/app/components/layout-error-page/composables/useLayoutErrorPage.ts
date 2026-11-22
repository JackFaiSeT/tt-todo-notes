import type { UiStatusScreenHandle } from '@uikit/components'
import { PAGE_SEO } from '@app/constants'
import { usePageSeoMeta } from '@app/composables'
import { HTTP_STATUS } from '@shared/contract/http'
import { LAYOUT_ERROR_PAGE_TEXTS } from '../constants'
import type { Props } from '../types'

export type UseLayoutErrorPageResult = {
  code: ComputedRef<number | undefined>
  title: ComputedRef<string>
  description: ComputedRef<string>
}

export const useLayoutErrorPage = (props: Props): UseLayoutErrorPageResult => {
  const isInitialVisit = !useRouter().options.history.state.back
  const screen = useTemplateRef<UiStatusScreenHandle>('screen')

  const isNotFound = computed<boolean>(() => props.error.statusCode === HTTP_STATUS.NOT_FOUND)

  const code = computed<number | undefined>(() => props.error.statusCode)

  const title = computed<string>(() =>
    toValue(isNotFound) ? LAYOUT_ERROR_PAGE_TEXTS.NOT_FOUND : LAYOUT_ERROR_PAGE_TEXTS.UNAVAILABLE
  )

  const description = computed<string>(() =>
    toValue(isNotFound)
      ? LAYOUT_ERROR_PAGE_TEXTS.NOT_FOUND_DESCRIPTION
      : LAYOUT_ERROR_PAGE_TEXTS.UNAVAILABLE_DESCRIPTION
  )

  usePageSeoMeta(() => ({ title: toValue(title), description: PAGE_SEO.ERROR.description }))

  onMounted(() => {
    if (!isInitialVisit) {
      toValue(screen)?.focus()
    }
  })

  return { code, title, description }
}
