import { hasContent } from '@shared/contract/notes/content'
import type { TodoId } from '@shared/contract/notes/ids'
import { useMinimumPending } from '@shared/composables'
import { formatDate, formatTime } from '@shared/utils/format-date'
import { EDITOR_STATUSES, NOTE_PROGRESS_TEXTS } from '@notes/constants'
import { useNoteEditor, useNotesListCache } from '@notes/composables'
import type { EditorSession } from '@notes/stores/useEditorStore'
import { canAddTodo, countCompleted, hasEmptyTodos } from '@notes/utils/content'
import type { NNotes } from '@notes/domain'
import { NOTE_EDITOR_ELEMENT_IDS, NOTE_EDITOR_TEXTS } from '../constants'
import { isLoadingStatus, toEditorOutline, toStatusText } from '../utils'
import type { EditorOutline, Props } from '../types'
import { useDraftOffer } from './useDraftOffer'
import { useEditorAnnouncement } from './useEditorAnnouncement'
import { useEditorFocus } from './useEditorFocus'
import { useEditorHistory } from './useEditorHistory'
import { useEditorLeaving } from './useEditorLeaving'
import { useEditorLoading } from './useEditorLoading'
import { useEditorNavigation } from './useEditorNavigation'
import { useEditorRows } from './useEditorRows'
import { useEditorSaving } from './useEditorSaving'
import { useToolbarFocusGuard } from './useToolbarFocusGuard'

export type UseNoteEditorViewResult = {
  editor: EditorSession
  outline: ComputedRef<EditorOutline>
  headingText: ComputedRef<string>
  statusText: ComputedRef<string>
  progressText: ComputedRef<string>
  stateTexts: ComputedRef<string[]>
  announcement: Readonly<ShallowRef<string>>
  isReady: ComputedRef<boolean>
  isPending: Readonly<ShallowRef<boolean>>
  isMissing: ComputedRef<boolean>
  isExisting: ComputedRef<boolean>
  isAtLimit: ComputedRef<boolean>
  isSheetVisible: ComputedRef<boolean>
  isAddDisabled: ComputedRef<boolean>
  addDescribedBy: ComputedRef<string | undefined>
  isInvalid: ComputedRef<boolean>
  saveHintText: ComputedRef<string>
  draftSavedText: ComputedRef<string>
  hasDraftNotice: ComputedRef<boolean>
  handleStep: (direction: NNotes.HistoryDirection) => Promise<void>
  handleSave: () => Promise<void>
  handleSaveCopy: () => Promise<void>
  handleInvalid: () => void
  handleCancel: () => Promise<void>
  handleDelete: () => Promise<void>
  handleOfferDraft: () => Promise<void>
  handleDropDraft: () => Promise<void>
  handleRetry: () => Promise<void>
  handleTitleInput: (event: Event) => void
  handleCommit: () => void
  handleAdd: () => void
  onTodoText: (id: TodoId, text: string) => void
  onTodoToggle: (id: TodoId) => void
  onTodoInsert: (id: TodoId) => void
  onTodoRemove: (id: TodoId) => void
}

export const useNoteEditorView = (props: Props): UseNoteEditorViewResult => {
  const isInitialVisit = useNuxtApp().isHydrating
  const session = useNoteEditor(() => props.noteKey)
  const listCache = useNotesListCache()
  const { editor } = session
  const focus = useEditorFocus()

  const { announcement, announce } = useEditorAnnouncement()

  useToolbarFocusGuard()

  const { canLeave } = useEditorLeaving(session)
  const navigation = useEditorNavigation(canLeave)

  const { isOffering, reserveOffer, handleOfferDraft, handleDropDraft } = useDraftOffer({
    session,
    focus,
    navigation,
    announce
  })

  const { handleSave, handleDiscard, handleInvalid } = useEditorSaving({ session, navigation, focus })
  const { handleAdd, handleRemoveRow } = useEditorRows({ editor, focus })
  const { handleStep } = useEditorHistory({ editor, focus, announce })
  const { isPending, whenSettled } = useMinimumPending(() => isLoadingStatus(editor.status))

  const { load } = useEditorLoading({
    session,
    focus,
    offerDraft: handleOfferDraft,
    reserveOffer,
    whenShown: whenSettled
  })

  const outline = computed<EditorOutline>(() => toEditorOutline(listCache.peek(), props.noteKey))

  const isReady = computed<boolean>(() => editor.status === EDITOR_STATUSES.READY && !toValue(isPending))

  const hasDraftNotice = computed<boolean>(() => editor.hasCandidate && !toValue(isOffering))

  const isMissing = computed<boolean>(() => editor.status === EDITOR_STATUSES.MISSING)

  const hasSavedNote = computed<boolean>(() =>
    toValue(isPending) ? toValue(outline).isExisting : Boolean(editor.base)
  )

  const isExisting = computed<boolean>(() => toValue(hasSavedNote) && !editor.isDeleted)

  const isAtLimit = computed<boolean>(() => !canAddTodo(editor.content))

  const isSheetVisible = computed<boolean>(() => toValue(isReady) || toValue(isPending))

  const isAddDisabled = computed<boolean>(() => toValue(isAtLimit) || editor.isBusy)

  const addDescribedBy = computed<string | undefined>(() =>
    toValue(isAtLimit) ? NOTE_EDITOR_ELEMENT_IDS.ITEM_LIMIT_HINT : undefined
  )

  const isInvalid = computed<boolean>(() => !editor.isValid)

  const saveHintText = computed<string>(() => {
    if (!hasContent(editor.content)) {
      return NOTE_EDITOR_TEXTS.HINT_INVALID
    }

    return hasEmptyTodos(editor.content) ? NOTE_EDITOR_TEXTS.HINT_EMPTY_ITEMS : ''
  })

  const draftSavedText = computed<string>(() => {
    const savedAt = toValue(session.candidate)?.draft.savedAt

    return savedAt ? `${formatDate(savedAt)}, ${formatTime(savedAt)}` : ''
  })

  const headingText = computed<string>(() =>
    toValue(hasSavedNote) ? NOTE_EDITOR_TEXTS.HEADING_EXISTING : NOTE_EDITOR_TEXTS.HEADING_NEW
  )

  const statusText = computed<string>(() => toStatusText(editor))

  const progressText = computed<string>(() =>
    NOTE_PROGRESS_TEXTS.COUNT(countCompleted(editor.content), editor.content.todos.length)
  )

  const stateTexts = computed<string[]>(() =>
    [
      toValue(isPending) ? NOTE_EDITOR_TEXTS.LOADING : '',
      editor.hasConflict ? NOTE_EDITOR_TEXTS.CONFLICT : '',
      toValue(isReady) && toValue(isAtLimit) ? NOTE_EDITOR_TEXTS.LIMIT_REACHED : ''
    ].filter(Boolean)
  )

  const handleTitleInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      editor.inputTitle(event.target.value)
    }
  }

  onMounted(() => {
    void load(props.noteKey, { shouldFocusHeading: !isInitialVisit })
  })

  watch(
    () => props.noteKey,
    (key) => {
      if (key !== editor.key) {
        void load(key, { shouldFocusHeading: true })
      }
    }
  )

  return {
    editor,
    outline,
    headingText,
    statusText,
    progressText,
    stateTexts,
    announcement,
    isReady,
    isPending,
    isMissing,
    isExisting,
    isAtLimit,
    isSheetVisible,
    isAddDisabled,
    addDescribedBy,
    isInvalid,
    saveHintText,
    draftSavedText,
    hasDraftNotice,
    handleStep,
    handleSave: () => handleSave({ isCopy: editor.isDeleted }),
    handleSaveCopy: () => handleSave({ isCopy: true }),
    handleInvalid,
    handleCancel: () => handleDiscard(),
    handleDelete: () => handleDiscard({ shouldDeleteNote: true }),
    handleOfferDraft,
    handleDropDraft,
    handleRetry: () => load(props.noteKey, { shouldFocusHeading: true }),
    handleTitleInput,
    handleCommit: editor.commitInput,
    handleAdd: () => handleAdd(),
    onTodoText: editor.inputTodo,
    onTodoToggle: editor.toggleTodo,
    onTodoInsert: handleAdd,
    onTodoRemove: handleRemoveRow
  }
}
