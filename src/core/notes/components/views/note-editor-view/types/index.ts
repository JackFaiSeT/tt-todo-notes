import type { DraftKey, TodoId } from '@shared/contract/notes/ids'
import type { UseNoteEditorResult } from '@notes/composables'
import type { EditorSession } from '@notes/stores/useEditorStore'

export type Props = {
  noteKey: DraftKey
}

export type TodoRowHandle = {
  getId: () => TodoId
  focus: () => void
  containsFocus: () => boolean
}

export type FocusableHandle = {
  focus: () => void
}

export type EditorFocus = {
  focusTitle: () => void
  focusHeading: () => void
  focusRow: (id?: TodoId) => void
  getFocusedRowId: () => TodoId | undefined
}

export type EditorNavigation = {
  replaceKey: (key: DraftKey) => Promise<void>
  leave: () => Promise<void>
}

export type EditorAnnounce = (text: string) => void

export type EditorLoadOptions = {
  shouldFocusHeading: boolean
}

export type DraftOfferOptions = {
  session: UseNoteEditorResult
  focus: EditorFocus
  navigation: EditorNavigation
  announce: EditorAnnounce
}

export type DraftOfferResult = {
  isOffering: Readonly<ShallowRef<boolean>>
  reserveOffer: () => void
  handleOfferDraft: () => Promise<void>
  handleDropDraft: () => Promise<void>
}

export type EditorSavingOptions = {
  session: UseNoteEditorResult
  navigation: EditorNavigation
  focus: EditorFocus
}

export type SavedNotificationContext = {
  isNew: boolean
  isCopy: boolean
}

export type EditorRowsOptions = {
  editor: EditorSession
  focus: EditorFocus
}

export type EditorHistoryOptions = {
  editor: EditorSession
  focus: EditorFocus
  announce: EditorAnnounce
}

export type EditorLoadingOptions = {
  session: UseNoteEditorResult
  focus: EditorFocus
  offerDraft: () => Promise<void>
  reserveOffer: () => void
  whenShown: () => Promise<void>
}

export type DraftOfferContext = {
  key: DraftKey
  isDirty: boolean
}

export type EditorOutline = {
  rows: number
  isExisting: boolean
}
