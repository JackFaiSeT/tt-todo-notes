import type { TodoId } from '@shared/contract/notes/ids'
import type { EditorFocus, FocusableHandle, TodoRowHandle } from '../types'

export const useEditorFocus = (): EditorFocus => {
  const rows = useTemplateRef<TodoRowHandle[]>('rows')
  const heading = useTemplateRef<HTMLElement>('heading')
  const fallback = useTemplateRef<FocusableHandle>('fallback')
  const titleInput = useTemplateRef<HTMLInputElement>('titleInput')
  const addButton = useTemplateRef<HTMLButtonElement>('addButton')

  const focusTitle = (): void => toValue(titleInput)?.focus()

  const focusHeading = (): void => (toValue(heading) ?? toValue(fallback))?.focus()

  const focusRow = (id?: TodoId): void => {
    const row = id ? toValue(rows)?.find((item) => item.getId() === id) : undefined
    const target = row ?? toValue(addButton)

    target?.focus()
  }

  const getFocusedRowId = (): TodoId | undefined =>
    toValue(rows)
      ?.find((row) => row.containsFocus())
      ?.getId()

  return { focusTitle, focusHeading, focusRow, getFocusedRowId }
}
