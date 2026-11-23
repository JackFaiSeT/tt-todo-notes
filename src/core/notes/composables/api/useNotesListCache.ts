import { NOTES_DATA_KEYS } from '@notes/constants'
import type { NNotes } from '@notes/domain'

export type UseNotesListCacheResult = {
  read: (search: string) => NNotes.ListCache | null
  peek: () => NNotes.Page | undefined
  write: (entry: NNotes.ListCache) => void
  clear: () => void
}

export const useNotesListCache = (): UseNotesListCacheResult => {
  const cache = useState<NNotes.ListCache | null>(NOTES_DATA_KEYS.listCache, () => null)

  const read = (search: string): NNotes.ListCache | null => {
    const entry = toValue(cache)

    return entry?.search === search ? entry : null
  }

  const peek = (): NNotes.Page | undefined => toValue(cache)?.page

  const write = (entry: NNotes.ListCache): void => {
    cache.value = entry
  }

  const clear = (): void => {
    cache.value = null
  }

  return { read, peek, write, clear }
}
