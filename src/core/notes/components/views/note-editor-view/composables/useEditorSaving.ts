import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { DIALOG_ANSWERS } from '@shared/constants/dialog'
import { useModalsStore } from '@shared/stores/useModalsStore'
import { useNotificationsStore } from '@shared/stores/useNotificationsStore'
import { SAVE_OUTCOMES } from '@notes/constants'
import { isBlankTodo } from '@notes/utils/content'
import type { NNotes } from '@notes/domain'
import { NOTE_EDITOR_NOTIFICATIONS } from '../constants'
import { EDITOR_DIALOGS } from '../constants/dialogs'
import { toSavedNotification } from '../utils'
import type { EditorSavingOptions } from '../types'

export type UseEditorSavingResult = {
  handleSave: (options?: NNotes.SaveOptions) => Promise<void>
  handleDiscard: (options?: NNotes.DiscardOptions) => Promise<void>
  handleInvalid: () => void
}

export const useEditorSaving = ({ session, navigation, focus }: EditorSavingOptions): UseEditorSavingResult => {
  const modals = useModalsStore()
  const notifications = useNotificationsStore()
  const { editor } = session

  const handleSave = async (options: NNotes.SaveOptions = {}): Promise<void> => {
    const token = editor.captureSession()
    const isNew = editor.key === NEW_DRAFT_KEY
    let result = await session.save(options)

    while (
      result?.kind === SAVE_OUTCOMES.CONFLICT &&
      (await modals.confirm(EDITOR_DIALOGS.OVERWRITE)) &&
      token.isCurrent()
    ) {
      result = await session.save({ ...options, isForced: true })
    }

    if (result?.kind === SAVE_OUTCOMES.SAVED) {
      notifications.success(toSavedNotification({ isNew, isCopy: Boolean(options.isCopy) }))
      await navigation.replaceKey(result.note.id)
    }
  }

  const discardChanges = async (): Promise<void> => {
    if (!(await session.discard())) {
      return
    }

    notifications.success(NOTE_EDITOR_NOTIFICATIONS.DISCARDED)

    if (editor.hasConflict) {
      await session.open(editor.key)
    }

    await nextTick()
    focus.focusTitle()
  }

  const deleteNote = async (): Promise<void> => {
    if (await session.discard({ shouldDeleteNote: true })) {
      notifications.success(NOTE_EDITOR_NOTIFICATIONS.DELETED)
      await navigation.leave()
    }
  }

  const handleDiscard = async ({ shouldDeleteNote = false }: NNotes.DiscardOptions = {}): Promise<void> => {
    const token = editor.captureSession()
    const isConfirmed = await modals.confirm(shouldDeleteNote ? EDITOR_DIALOGS.DELETE : EDITOR_DIALOGS.DISCARD)

    if (!isConfirmed || !token.isCurrent()) {
      return
    }

    try {
      await (shouldDeleteNote ? deleteNote() : discardChanges())
    } catch (error) {
      session.report(error)
    }
  }

  const onExternalDeletion = async (): Promise<void> => {
    const token = editor.captureSession()
    const answer = await modals.choose({ ...EDITOR_DIALOGS.EXTERNAL_DELETION, isAcceptDisabled: !editor.isValid })

    if (!token.isCurrent()) {
      return
    }

    if (answer === DIALOG_ANSWERS.ACCEPT) {
      await handleSave({ isCopy: true })
    }

    if (answer === DIALOG_ANSWERS.DECLINE) {
      await navigation.leave()
    }
  }

  const handleInvalid = (): void => {
    const blank = editor.content.todos.find(isBlankTodo)

    if (blank) {
      focus.focusRow(blank.id)
    } else {
      focus.focusTitle()
    }
  }

  watch(
    () => editor.isDeleted,
    (isDeleted) => {
      if (isDeleted) {
        void onExternalDeletion()
      }
    }
  )

  return { handleSave, handleDiscard, handleInvalid }
}
