import type { AsyncDataRequestStatus } from '#app'
import { ASYNC_DATA_STATUSES } from '@shared/constants/async-data'
import { NOTES_DATA_KEYS } from '@notes/constants'
import { useNotesService } from '@notes/composables/useNotesService'
import { mergePages, toRefreshLimits } from '@notes/utils/page'
import type { NNotes } from '@notes/domain'
import { useNotesListCache } from './useNotesListCache'

export type UseNotesPageResult = {
  page: Ref<NNotes.Page | undefined>
  status: Ref<AsyncDataRequestStatus>
  resultSearch: Readonly<ShallowRef<string>>
  isLoadingMore: ShallowRef<boolean>
  loadMoreError: ShallowRef<unknown>
  loadMore: () => Promise<number>
  refresh: () => Promise<void>
}

export const useNotesPage = (search: MaybeRefOrGetter<string>): UseNotesPageResult => {
  const notesService = useNotesService()
  const listCache = useNotesListCache()
  const cached = listCache.read(toValue(search))

  let depth = cached?.depth ?? 1
  let loadedSearch = toValue(search)
  let pending: AbortController | undefined

  const resultSearch = shallowRef<string>(toValue(search))

  const isLoadingMore = shallowRef<boolean>(false)

  const loadMoreError = shallowRef<unknown>(null)

  const {
    data: page,
    status,
    refresh: refreshPage
  } = useLazyAsyncData<NNotes.Page>(
    NOTES_DATA_KEYS.list,
    async (_nuxtApp, { signal }) => {
      const q = toValue(search)

      pending?.abort()
      loadMoreError.value = null

      if (q !== loadedSearch) {
        depth = 1
        loadedSearch = q
      }

      const [first, ...rest] = toRefreshLimits(depth)

      let loaded = await notesService.list({ q, limit: first, signal })

      for (const limit of rest) {
        if (!loaded.nextCursor) {
          return loaded
        }

        loaded = mergePages(loaded, await notesService.list({ q, cursor: loaded.nextCursor, limit, signal }))
      }

      return loaded
    },
    {
      watch: [() => toValue(search)]
    }
  )

  if (cached && !toValue(page)) {
    page.value = cached.page
  }

  const loadMore = async (): Promise<number> => {
    const previous = toValue(page)

    if (!previous?.nextCursor || pending || toValue(status) === ASYNC_DATA_STATUSES.PENDING) {
      return 0
    }

    const request = new AbortController()

    pending = request
    isLoadingMore.value = true
    loadMoreError.value = null

    try {
      const next = await notesService.list({ q: loadedSearch, cursor: previous.nextCursor, signal: request.signal })

      if (request.signal.aborted || previous !== toValue(page)) {
        return 0
      }

      const merged = mergePages(previous, next)

      depth++
      page.value = merged

      return merged.items.length - previous.items.length
    } catch (error) {
      if (!request.signal.aborted) {
        loadMoreError.value = error
      }

      return 0
    } finally {
      pending = undefined
      isLoadingMore.value = false
    }
  }

  const refresh = async (): Promise<void> => {
    await refreshPage()
  }

  watch(page, (value) => {
    if (value) {
      resultSearch.value = loadedSearch
      listCache.write({ search: loadedSearch, depth, page: value })
    }
  })

  onScopeDispose(() => pending?.abort())

  return {
    page,
    status,
    resultSearch: shallowReadonly(resultSearch),
    isLoadingMore,
    loadMoreError,
    loadMore,
    refresh
  }
}
