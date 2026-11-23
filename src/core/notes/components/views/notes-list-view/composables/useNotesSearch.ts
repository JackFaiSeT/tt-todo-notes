import { useTimeClient } from '@shared/composables'
import { NOTES_SEARCH_DELAY_MS, NOTES_SEARCH_QUERY_KEY } from '../constants'
import { toSearchText } from '../utils'

export type UseNotesSearchResult = {
  query: ShallowRef<string>
  search: ComputedRef<string>
  resetSearch: () => void
}

export const useNotesSearch = (): UseNotesSearchResult => {
  const route = useRoute()
  const router = useRouter()
  const timeClient = useTimeClient()

  const search = computed<string>(() => toSearchText(route.query[NOTES_SEARCH_QUERY_KEY]))

  const query = shallowRef<string>(toValue(search))

  const apply = (): void => {
    const text = toValue(query).trim()

    if (text === toValue(search)) {
      return
    }

    const { [NOTES_SEARCH_QUERY_KEY]: _previous, ...rest } = route.query

    void router.replace({ query: text ? { ...rest, [NOTES_SEARCH_QUERY_KEY]: text } : rest })
  }

  const delayed = timeClient.debounce(NOTES_SEARCH_DELAY_MS, apply)

  const resetSearch = (): void => {
    query.value = ''
    delayed.cancel()
    apply()
  }

  watch(query, () => delayed.schedule())

  watch(search, (text) => {
    if (text !== toValue(query).trim()) {
      delayed.cancel()
      query.value = text
    }
  })

  onScopeDispose(() => delayed.cancel())

  return { query, search, resetSearch }
}
