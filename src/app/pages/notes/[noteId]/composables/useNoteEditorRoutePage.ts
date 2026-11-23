import { PAGE_SEO } from '@app/constants'
import { usePageSeoMeta } from '@app/composables'
import { HTTP_STATUS } from '@shared/contract/http'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { parseDraftKey } from '@shared/contract/notes/ids'
import type { DraftKey } from '@shared/contract/notes/ids'
import { EDITOR_STATUSES, NOTE_TEXTS, useEditorStore } from '@notes'

export type UseNoteEditorRoutePageResult = {
  noteKey: ComputedRef<DraftKey>
}

export const useNoteEditorRoutePage = (): UseNoteEditorRoutePageResult => {
  const route = useRoute()
  const editor = useEditorStore()

  const noteKey = computed<DraftKey>(() => {
    try {
      return parseDraftKey(route.params.noteId)
    } catch (cause) {
      throw createError({ statusCode: HTTP_STATUS.NOT_FOUND, cause, fatal: true })
    }
  })

  const title = computed<string>(() => {
    const isCurrent = editor.key === toValue(noteKey)

    if (isCurrent && editor.status === EDITOR_STATUSES.MISSING) {
      return NOTE_TEXTS.MISSING
    }

    const fallback = toValue(noteKey) === NEW_DRAFT_KEY ? NOTE_TEXTS.NEW : NOTE_TEXTS.FALLBACK_TITLE

    return (isCurrent && editor.content.title.trim()) || fallback
  })

  usePageSeoMeta(() => ({ title: toValue(title), description: PAGE_SEO.NOTE_EDITOR.description }))

  return { noteKey }
}
