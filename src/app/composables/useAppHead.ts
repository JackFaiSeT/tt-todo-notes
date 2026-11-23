import { APP_NAME, APP_TITLE_SEPARATOR } from '@app/constants'

export const useAppHead = (): void => {
  useHead({
    titleTemplate: (title) => (title && title !== APP_NAME ? title + APP_TITLE_SEPARATOR + APP_NAME : APP_NAME)
  })
}
