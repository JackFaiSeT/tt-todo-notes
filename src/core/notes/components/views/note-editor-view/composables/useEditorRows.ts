import type { TodoId } from '@shared/contract/notes/ids'
import type { EditorRowsOptions } from '../types'

export type UseEditorRowsResult = {
  handleAdd: (after?: TodoId) => void
  handleRemoveRow: (id: TodoId) => void
}

export const useEditorRows = ({ editor, focus }: EditorRowsOptions): UseEditorRowsResult => {
  const focusRow = async (id?: TodoId): Promise<void> => {
    await nextTick()
    focus.focusRow(id)
  }

  const handleAdd = (after?: TodoId): void => {
    if (editor.isBusy) {
      return
    }

    const id = editor.addTodo(after)

    if (id) {
      void focusRow(id)
    }
  }

  const handleRemoveRow = (id: TodoId): void => {
    const index = editor.content.todos.findIndex((todo) => todo.id === id)

    editor.removeTodo(id)
    void focusRow(editor.content.todos[Math.max(0, index - 1)]?.id)
  }

  return { handleAdd, handleRemoveRow }
}
