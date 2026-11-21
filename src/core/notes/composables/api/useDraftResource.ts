import type { DraftKey } from '@shared/contract/notes/ids'
import { NOTES_DATA_KEYS } from '@notes/constants'
import { useNotesService } from '@notes/composables/useNotesService'
import type { NNotes } from '@notes/domain'
import { useKeyedResource, type UseKeyedResourceResult } from './useKeyedResource'

export type UseDraftResourceResult = UseKeyedResourceResult<NNotes.Draft | null>

export const useDraftResource = (keySource: MaybeRefOrGetter<DraftKey>): UseDraftResourceResult => {
  const notesService = useNotesService()

  return useKeyedResource<NNotes.Draft | null>(keySource, {
    toDataKey: NOTES_DATA_KEYS.draft,
    fetch: (key, signal) => notesService.draft(key, { signal })
  })
}
