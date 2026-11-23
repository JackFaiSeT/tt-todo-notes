import { ASYNC_DATA_STATUSES } from '@shared/constants/async-data'
import { useMinimumPending } from '@shared/composables'
import { useNotesPage } from '@notes/composables'
import { toNotesErrorText } from '@notes/utils/error-text'
import type { NNotes } from '@notes/domain'
import { NOTES_LIST_SKELETONS, NOTES_LIST_TEXTS } from '../constants'
import { useNoteRemoval } from './useNoteRemoval'
import { useNotesListFocus } from './useNotesListFocus'
import { useNotesSearch } from './useNotesSearch'

export type UseNotesListViewResult = {
  query: ShallowRef<string>
  resultSearch: Readonly<ShallowRef<string>>
  notes: ComputedRef<NNotes.Summary[]>
  countText: ComputedRef<string>
  countLabel: ComputedRef<string>
  statusText: ComputedRef<string>
  moreText: ComputedRef<string>
  moreErrorText: ComputedRef<string>
  skeletonCount: ComputedRef<number>
  isLoading: Readonly<ShallowRef<boolean>>
  isSearching: ComputedRef<boolean>
  hasError: ComputedRef<boolean>
  hasSearchError: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
  isNothingFound: ComputedRef<boolean>
  hasMore: ComputedRef<boolean>
  isLoadingMore: ShallowRef<boolean>
  handleMore: () => Promise<void>
  handleRemove: (note: NNotes.Summary) => Promise<void>
  handleRetry: () => Promise<void>
  handleResetSearch: () => Promise<void>
}

export const useNotesListView = (): UseNotesListViewResult => {
  const { query, search, resetSearch } = useNotesSearch()
  const { page, status, resultSearch, isLoadingMore, loadMoreError, loadMore, refresh } = useNotesPage(search)
  const { isFocusAtMore, focusNote, focusSearch } = useNotesListFocus()
  const { removeNote } = useNoteRemoval({ refresh })

  const { isPending: isLoading } = useMinimumPending(
    () => !toValue(page) && toValue(status) !== ASYNC_DATA_STATUSES.ERROR
  )

  const announcement = shallowRef<string>('')

  const notes = computed<NNotes.Summary[]>(() => (toValue(isLoading) ? [] : (toValue(page)?.items ?? [])))

  const total = computed<number>(() => toValue(page)?.count ?? 0)

  const isSearching = computed<boolean>(
    () => toValue(search) !== toValue(resultSearch) && toValue(status) !== ASYNC_DATA_STATUSES.ERROR
  )

  const hasError = computed<boolean>(
    () => !toValue(isLoading) && !toValue(page) && toValue(status) === ASYNC_DATA_STATUSES.ERROR
  )

  const hasSearchError = computed<boolean>(
    () =>
      Boolean(toValue(page)) &&
      toValue(search) !== toValue(resultSearch) &&
      toValue(status) === ASYNC_DATA_STATUSES.ERROR
  )

  const isLoaded = computed<boolean>(() => !toValue(isLoading) && Boolean(toValue(page)))

  const isEmpty = computed<boolean>(() => toValue(isLoaded) && toValue(total) === 0 && !toValue(resultSearch))

  const isNothingFound = computed<boolean>(
    () => toValue(isLoaded) && toValue(notes).length === 0 && Boolean(toValue(resultSearch))
  )

  const hasMore = computed<boolean>(() => !toValue(isLoading) && Boolean(toValue(page)?.nextCursor))

  const countText = computed<string>(() => String(toValue(total)))

  const countLabel = computed<string>(() =>
    toValue(resultSearch) ? NOTES_LIST_TEXTS.FOUND(toValue(total)) : NOTES_LIST_TEXTS.COUNT(toValue(total))
  )

  const statusText = computed<string>(() => (toValue(isLoading) ? NOTES_LIST_TEXTS.LOADING : toValue(announcement)))

  const moreText = computed<string>(() =>
    toValue(isLoadingMore) ? NOTES_LIST_TEXTS.LOADING_MORE : NOTES_LIST_TEXTS.MORE
  )

  const moreErrorText = computed<string>(() => {
    const error = toValue(loadMoreError)

    return error ? toNotesErrorText(error) : ''
  })

  const skeletonCount = computed<number>(() => {
    if (toValue(isLoading)) {
      return NOTES_LIST_SKELETONS.INITIAL
    }

    return toValue(isLoadingMore) ? NOTES_LIST_SKELETONS.MORE : 0
  })

  const handleRemove = async (note: NNotes.Summary): Promise<void> => {
    const neighborIds = await removeNote(note, notes)

    if (!neighborIds) {
      return
    }

    await nextTick()

    const visibleIds = new Set(toValue(notes).map((item) => item.id))

    focusNote(neighborIds.find((id) => visibleIds.has(id)))
  }

  const handleMore = async (): Promise<void> => {
    if (toValue(isLoadingMore)) {
      return
    }

    const previousCount = toValue(notes).length
    const shouldMoveFocus = isFocusAtMore()

    announcement.value = ''

    const addedCount = await loadMore()

    if (addedCount === 0) {
      return
    }

    announcement.value = NOTES_LIST_TEXTS.ADDED(addedCount)

    if (shouldMoveFocus && !toValue(hasMore)) {
      await nextTick()
      focusNote(toValue(notes)[previousCount]?.id)
    }
  }

  const handleRetry = async (): Promise<void> => {
    await refresh()
    await nextTick()
    focusNote(undefined)
  }

  const handleResetSearch = async (): Promise<void> => {
    resetSearch()
    await nextTick()
    focusSearch()
  }

  watch(resultSearch, (text) => {
    if (!text) {
      announcement.value = ''

      return
    }

    announcement.value = toValue(total) ? NOTES_LIST_TEXTS.FOUND(toValue(total)) : NOTES_LIST_TEXTS.NOTHING_FOUND
  })

  return {
    query,
    resultSearch,
    notes,
    countText,
    countLabel,
    statusText,
    moreText,
    moreErrorText,
    skeletonCount,
    isLoading,
    isSearching,
    hasError,
    hasSearchError,
    isEmpty,
    isNothingFound,
    hasMore,
    isLoadingMore,
    handleMore,
    handleRemove,
    handleRetry,
    handleResetSearch
  }
}
