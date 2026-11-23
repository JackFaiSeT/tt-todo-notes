import type { Untrusted } from '@shared/contract/types'
import type {
  Note,
  NoteSummary,
  NotePage,
  NotePageQuery,
  Draft,
  Todo,
  Operation,
  CreateNote,
  UpdateNote,
  PutDraft
} from '@shared/contract/notes/types'

export namespace NNotesDataContracts {
  export type GetNotesListData = Untrusted<NotePage>

  export type GetNoteItemData = Untrusted<Note>

  export type GetNoteSummaryData = Untrusted<NoteSummary>

  export type GetDraftData = Untrusted<Draft>

  export type GetTodoItemData = Untrusted<Todo>

  export type GetNotesListRequestParams = NotePageQuery

  export type OperationRequestBody = Operation

  export type TodoRequestBody = Todo

  export type PostNoteRequestBody = CreateNote

  export type PutNoteRequestBody = UpdateNote

  export type PutDraftRequestBody = PutDraft
}
