import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import type { DraftKey } from '@shared/contract/notes/ids'
import { NOTES_DATA_KEYS } from '@notes/constants'
import { useNotesService } from '@notes/composables/useNotesService'
import type { NNotes } from '@notes/domain'
import { useKeyedResource, type UseKeyedResourceResult } from './useKeyedResource'

export type UseNoteResourceResult = UseKeyedResourceResult<NNotes.Model | null>

export const useNoteResource = (keySource: MaybeRefOrGetter<DraftKey>): UseNoteResourceResult => {
  const notesService = useNotesService()

  return useKeyedResource<NNotes.Model | null>(keySource, {
    toDataKey: NOTES_DATA_KEYS.note,
    fetch: (key, signal) => (key === NEW_DRAFT_KEY ? Promise.resolve(null) : notesService.get(key, { signal }))
  })
}
