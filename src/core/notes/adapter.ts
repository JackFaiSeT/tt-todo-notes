import { DRAFT_SCHEMA_VERSION, OPERATION_TYPES } from '@shared/contract/notes/constants'
import { parseNoteId, parseTodoId } from '@shared/contract/notes/ids'
import { readStoredDraft } from '@shared/contract/notes/stored-draft'
import { NOTES_CONTRACT_VIOLATIONS } from './constants'
import type { NNotes } from './domain'
import type { NNotesDataContracts } from './domain/data-contracts'

export interface INotesAdapter {
  toCreateBody(content: NNotes.Content, options: NNotes.CreateBodyOptions): NNotesDataContracts.PostNoteRequestBody
  toUpdateBody(content: NNotes.Content, options: NNotes.UpdateBodyOptions): NNotesDataContracts.PutNoteRequestBody
  toDraftBody(draft: NNotes.Draft, observedVersion?: number): NNotesDataContracts.PutDraftRequestBody
  toModel(data: NNotesDataContracts.GetNoteItemData): NNotes.Model
  toPage(data: NNotesDataContracts.GetNotesListData): NNotes.Page
  toSummary(data: NNotesDataContracts.GetNoteSummaryData): NNotes.Summary
  toDraft(data: NNotesDataContracts.GetDraftData): NNotes.Draft
  toStoredDraft(value: unknown): NNotes.Draft
}

const toTodo = (data: NNotesDataContracts.GetTodoItemData): NNotes.Todo => ({
  id: parseTodoId(data.id),
  text: data.text ?? '',
  done: data.done ?? false
})

const toTodoBody = ({ id, text, done }: NNotes.Todo): NNotesDataContracts.TodoRequestBody => ({ id, text, done })

const toOperationBody = (operation: NNotes.Operation): NNotesDataContracts.OperationRequestBody => {
  switch (operation.type) {
    case OPERATION_TYPES.TITLE:
      return { type: operation.type, before: operation.before, after: operation.after }
    case OPERATION_TYPES.TODO_TEXT:
      return { type: operation.type, todoId: operation.todoId, before: operation.before, after: operation.after }
    case OPERATION_TYPES.TODO_TOGGLE:
      return { type: operation.type, todoId: operation.todoId, done: operation.done }
    case OPERATION_TYPES.TODO_ADD:
    case OPERATION_TYPES.TODO_REMOVE:
      return { type: operation.type, todo: toTodoBody(operation.todo), index: operation.index }
  }
}

export class NotesAdapter implements INotesAdapter {
  toCreateBody(content: NNotes.Content, { isCopy }: NNotes.CreateBodyOptions): NNotesDataContracts.PostNoteRequestBody {
    return { title: content.title, todos: content.todos.map(toTodoBody), fromDeletedNote: isCopy }
  }

  toUpdateBody(
    content: NNotes.Content,
    { baseVersion, isForced, confirmedVersion }: NNotes.UpdateBodyOptions
  ): NNotesDataContracts.PutNoteRequestBody {
    return {
      title: content.title,
      todos: content.todos.map(toTodoBody),
      baseVersion,
      force: isForced,
      confirmedVersion: isForced ? confirmedVersion : undefined
    }
  }

  toDraftBody(draft: NNotes.Draft, observedVersion?: number): NNotesDataContracts.PutDraftRequestBody {
    return {
      draft: {
        schemaVersion: DRAFT_SCHEMA_VERSION,
        noteId: draft.noteId,
        baseVersion: draft.baseVersion,
        content: { title: draft.content.title, todos: draft.content.todos.map(toTodoBody) },
        history: { undo: draft.history.undo.map(toOperationBody), redo: draft.history.redo.map(toOperationBody) },
        savedAt: draft.savedAt
      },
      observedVersion
    }
  }

  toModel(data: NNotesDataContracts.GetNoteItemData): NNotes.Model {
    return {
      id: parseNoteId(data.id),
      title: data.title ?? '',
      todos: (data.todos ?? []).map(toTodo),
      createdAt: data.createdAt ?? 0,
      updatedAt: data.updatedAt ?? 0,
      version: data.version ?? 1
    }
  }

  toPage(data: NNotesDataContracts.GetNotesListData): NNotes.Page {
    if (!Array.isArray(data.items) || (data.nextCursor !== null && typeof data.nextCursor !== 'string')) {
      throw new TypeError(NOTES_CONTRACT_VIOLATIONS.PAGE)
    }

    const items = data.items.map((item) => this.toSummary(item))

    return { items, nextCursor: data.nextCursor, count: typeof data.count === 'number' ? data.count : items.length }
  }

  toSummary(data: NNotesDataContracts.GetNoteSummaryData): NNotes.Summary {
    return {
      id: parseNoteId(data.id),
      title: data.title ?? '',
      updatedAt: data.updatedAt ?? 0,
      version: data.version ?? 1,
      total: data.total ?? 0,
      completed: data.completed ?? 0,
      preview: (data.preview ?? []).map(toTodo)
    }
  }

  toDraft(data: NNotesDataContracts.GetDraftData): NNotes.Draft {
    return this.toStoredDraft(data)
  }

  toStoredDraft(value: unknown): NNotes.Draft {
    const { noteId, baseVersion, content, history, savedAt } = readStoredDraft(value)

    return { noteId, baseVersion, content, history, savedAt }
  }
}
