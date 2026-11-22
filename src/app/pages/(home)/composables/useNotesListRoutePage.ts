import { PAGE_SEO } from '@app/constants'
import { usePageSeoMeta } from '@app/composables'

export const useNotesListRoutePage = (): void => {
  usePageSeoMeta(PAGE_SEO.NOTES_LIST)
}
