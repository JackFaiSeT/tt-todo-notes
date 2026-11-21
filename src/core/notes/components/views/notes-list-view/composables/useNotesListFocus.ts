import type { UiSearchFieldHandle } from '@uikit/components'
import type { NoteId } from '@shared/contract/notes/ids'
import { toNoteLinkSelector } from '../utils'

export type UseNotesListFocusResult = {
  isFocusAtMore: () => boolean
  focusNote: (id: NoteId | undefined) => void
  focusSearch: () => void
}

export const useNotesListFocus = (): UseNotesListFocusResult => {
  const root = useTemplateRef<HTMLElement>('root')
  const heading = useTemplateRef<HTMLElement>('heading')
  const moreControl = useTemplateRef<HTMLElement>('moreControl')
  const searchField = useTemplateRef<UiSearchFieldHandle>('searchField')

  const isFocusAtMore = (): boolean => {
    const active = document.activeElement

    return !active || active === document.body || Boolean(toValue(moreControl)?.contains(active))
  }

  const focusNote = (id: NoteId | undefined): void => {
    const link = id ? toValue(root)?.querySelector<HTMLElement>(toNoteLinkSelector(id)) : null
    const target = link ?? toValue(heading)

    target?.focus()
  }

  const focusSearch = (): void => toValue(searchField)?.focus()

  return { isFocusAtMore, focusNote, focusSearch }
}
