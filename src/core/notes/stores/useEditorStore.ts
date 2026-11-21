import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { toPlainText } from '@shared/contract/notes/content'
import { parseTodoId } from '@shared/contract/notes/ids'
import type { DraftKey, TodoId } from '@shared/contract/notes/ids'
import { useIdClient, useTimeClient } from '@shared/composables'
import { createStoreId } from '@shared/utils/store-id'
import { EDITOR_STATUSES, NOTES_KEY } from '@notes/constants'
import { canAddTodo, canSaveContent, isSameContent, toContent } from '@notes/utils/content'
import { toAddOperation, toRemoveOperation, toToggleOperation } from '@notes/utils/todo-operations'
import { hasVersionConflict } from '@notes/utils/version'
import type { NNotes } from '@notes/domain'
import { EditHistory } from '@notes/history/edit-history'
import type { IEditHistory } from '@notes/history/edit-history'
import type { EditorStore, SessionToken } from './types'

export const EDITOR_STORE_ID = createStoreId(NOTES_KEY, 'editor')

export const useEditorStore = defineStore(EDITOR_STORE_ID, (): EditorStore => {
  const timeClient = useTimeClient()
  const idClient = useIdClient()

  let generation = 0

  const key = shallowRef<DraftKey>(NEW_DRAFT_KEY)
  const status = shallowRef<NNotes.EditorStatus>(EDITOR_STATUSES.CLOSED)
  const base = shallowRef<NNotes.Baseline | null>(null)
  const baseline = shallowRef<NNotes.Content>(toContent())
  const baseVersion = shallowRef<number | null>(null)
  const remoteVersion = shallowRef<number | undefined>(undefined)
  const isBusy = shallowRef<boolean>(false)
  const isDeleted = shallowRef<boolean>(false)
  const hasCandidate = shallowRef<boolean>(false)
  const hasRejectedVersion = shallowRef<boolean>(false)
  const revision = shallowRef<number>(0)

  const onHistoryChange = (): void => {
    triggerRef(history)
    revision.value = toValue(revision) + 1
  }

  const createHistory = (content: NNotes.Content, stacks?: NNotes.HistoryData): IEditHistory =>
    new EditHistory(timeClient, { content, history: stacks, onChange: onHistoryChange })

  const history = shallowRef<IEditHistory>(createHistory(toContent()))

  const content = computed<NNotes.Content>(() => toValue(history).content)

  const isDirty = computed<boolean>(() => !isSameContent(toValue(content), toValue(baseline)))

  const isValid = computed<boolean>(() => canSaveContent(toValue(content)))

  const hasConflict = computed<boolean>(
    () => toValue(hasRejectedVersion) || hasVersionConflict(toValue(baseVersion), toValue(remoteVersion))
  )

  const canUndo = computed<boolean>(() => toValue(history).canUndo)

  const canRedo = computed<boolean>(() => toValue(history).canRedo)

  const resetTo = (note: NNotes.Model | null): void => {
    toValue(history).commit()
    baseline.value = toContent(note ?? undefined)
    history.value = createHistory(toValue(baseline))
    base.value = note ? { version: note.version, updatedAt: note.updatedAt } : null
    baseVersion.value = note?.version ?? null
    remoteVersion.value = note?.version
    hasRejectedVersion.value = false
    isDeleted.value = false
    hasCandidate.value = false
  }

  const captureSession = (): SessionToken => {
    const captured = generation

    return { isCurrent: () => captured === generation }
  }

  const openSession = (target: DraftKey): void => {
    generation++
    isBusy.value = false
    key.value = target
    resetTo(null)
    status.value = EDITOR_STATUSES.LOADING
  }

  const closeSession = (): void => {
    generation++
    toValue(history).commit()
    status.value = EDITOR_STATUSES.CLOSED
  }

  const observeDraft = (draft: NNotes.Draft | null): void => {
    if (toValue(isBusy)) {
      return
    }

    if (!draft) {
      hasCandidate.value = false

      return
    }

    if (!toValue(isDirty)) {
      hasCandidate.value = !isSameContent(toValue(content), draft.content)
    }
  }

  const applyLoaded = (note: NNotes.Model | null, draft: NNotes.Draft | null): void => {
    resetTo(note)
    status.value = !note && toValue(key) !== NEW_DRAFT_KEY ? EDITOR_STATUSES.MISSING : EDITOR_STATUSES.READY
    observeDraft(draft)
  }

  const applySaved = (note: NNotes.Model): void => {
    key.value = note.id
    resetTo(note)
    status.value = EDITOR_STATUSES.READY
  }

  const restoreDraft = (draft: NNotes.Draft, recovery: NNotes.DraftRecovery): void => {
    toValue(history).commit()
    history.value = createHistory(draft.content, draft.history)
    key.value = recovery.key
    baseVersion.value = recovery.baseVersion
    status.value = EDITOR_STATUSES.READY
    hasCandidate.value = false
    onHistoryChange()
  }

  const revertSession = (): void => {
    toValue(history).commit()
    history.value = createHistory(toValue(baseline))
    hasCandidate.value = false
  }

  const observeNote = (note: NNotes.Model | null): void => {
    if (toValue(status) !== EDITOR_STATUSES.READY || toValue(key) === NEW_DRAFT_KEY || toValue(isBusy)) {
      return
    }

    if (!note) {
      isDeleted.value = true

      return
    }

    if (note.id !== toValue(key) || note.version <= (toValue(remoteVersion) ?? 0)) {
      return
    }

    if (!toValue(isDirty)) {
      const isOffered = toValue(hasCandidate)

      resetTo(note)
      hasCandidate.value = isOffered

      return
    }

    remoteVersion.value = note.version

    if (toValue(isDirty)) {
      revision.value = toValue(revision) + 1
    }
  }

  const markFailed = (): void => {
    status.value = EDITOR_STATUSES.ERROR
  }

  const markDeleted = (): void => {
    isDeleted.value = true
  }

  const rejectVersion = (latestVersion?: number): void => {
    hasRejectedVersion.value = true

    if (latestVersion !== undefined && latestVersion > (toValue(remoteVersion) ?? 0)) {
      remoteVersion.value = latestVersion
    }
  }

  const dismissCandidate = (): void => {
    hasCandidate.value = false
  }

  const holdCandidate = (): void => {
    hasCandidate.value = true
  }

  const startMutation = (): SessionToken | undefined => {
    if (toValue(isBusy)) {
      return undefined
    }

    isBusy.value = true
    toValue(history).commit()

    return captureSession()
  }

  const finishMutation = (): void => {
    isBusy.value = false
  }

  const inputTitle = (value: string): void => toValue(history).input(null, toPlainText(value))

  const inputTodo = (id: TodoId, value: string): void => toValue(history).input(id, toPlainText(value))

  const commitInput = (): void => toValue(history).commit()

  const addTodo = (after?: TodoId): TodoId | undefined => {
    if (!canAddTodo(toValue(content))) {
      return undefined
    }

    const id = idClient.next(parseTodoId)

    toValue(history).perform(toAddOperation(toValue(content), { id, after }))

    return id
  }

  const removeTodo = (id: TodoId): void => {
    const operation = toRemoveOperation(toValue(content), id)

    if (operation) {
      toValue(history).perform(operation)
    }
  }

  const toggleTodo = (id: TodoId): void => {
    const operation = toToggleOperation(toValue(content), id)

    if (operation) {
      toValue(history).perform(operation)
    }
  }

  const stepHistory = (direction: NNotes.HistoryDirection): boolean => toValue(history).step(direction)

  const serializeHistory = (): NNotes.HistoryData => toValue(history).serialize()

  return {
    key: shallowReadonly(key),
    status: shallowReadonly(status),
    base: shallowReadonly(base),
    baseVersion: shallowReadonly(baseVersion),
    remoteVersion: shallowReadonly(remoteVersion),
    isBusy: shallowReadonly(isBusy),
    isDeleted: shallowReadonly(isDeleted),
    hasCandidate: shallowReadonly(hasCandidate),
    hasRejectedVersion: shallowReadonly(hasRejectedVersion),
    revision: shallowReadonly(revision),
    content,
    isDirty,
    isValid,
    hasConflict,
    canUndo,
    canRedo,
    openSession,
    closeSession,
    captureSession,
    applyLoaded,
    applySaved,
    restoreDraft,
    revertSession,
    observeNote,
    observeDraft,
    markFailed,
    markDeleted,
    rejectVersion,
    dismissCandidate,
    holdCandidate,
    startMutation,
    finishMutation,
    inputTitle,
    inputTodo,
    commitInput,
    addTodo,
    removeTodo,
    toggleTodo,
    stepHistory,
    serializeHistory
  }
})

export type EditorSession = ReturnType<typeof useEditorStore>
