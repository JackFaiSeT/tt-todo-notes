import { DIALOG_ANSWERS } from '@shared/constants/dialog'
import type { DialogAnswer } from '@shared/stores/types'
import { useModalsStore } from '@shared/stores/useModalsStore'
import { useNotificationsStore } from '@shared/stores/useNotificationsStore'
import type { NNotes } from '@notes/domain'
import { NOTE_EDITOR_NOTIFICATIONS, NOTE_EDITOR_TEXTS } from '../constants'
import { toDraftOfferDialog } from '../utils'
import type { DraftOfferOptions, DraftOfferResult } from '../types'

export type UseDraftOfferResult = DraftOfferResult

export const useDraftOffer = ({ session, focus, navigation, announce }: DraftOfferOptions): UseDraftOfferResult => {
  const modals = useModalsStore()
  const notifications = useNotificationsStore()
  const { editor } = session

  const isOffering = shallowRef<boolean>(false)

  const reserveOffer = (): void => {
    isOffering.value = true
  }

  const restore = async (draft: NNotes.Draft): Promise<void> => {
    const destination = await session.restoreDraft(draft)

    notifications.success(NOTE_EDITOR_NOTIFICATIONS.DRAFT_RESTORED)

    if (destination) {
      await navigation.replaceKey(destination)
    }
  }

  const drop = async (): Promise<void> => {
    await session.dropDraft()
    notifications.success(NOTE_EDITOR_NOTIFICATIONS.DRAFT_DELETED)
  }

  const applyAnswer = async (answer: DialogAnswer, draft: NNotes.Draft): Promise<void> => {
    try {
      if (answer === DIALOG_ANSWERS.ACCEPT) {
        await restore(draft)
      }

      if (answer === DIALOG_ANSWERS.DECLINE) {
        await drop()
      }

      if (answer === DIALOG_ANSWERS.DISMISS) {
        announce(NOTE_EDITOR_TEXTS.DRAFT_POSTPONED)
      }
    } catch (error) {
      session.report(error)
    }
  }

  const handleOfferDraft = async (): Promise<void> => {
    const candidate = toValue(session.candidate)

    if (!candidate) {
      isOffering.value = false

      return
    }

    const token = editor.captureSession()

    isOffering.value = true

    const answer = await modals.choose(toDraftOfferDialog(candidate, { key: editor.key, isDirty: editor.isDirty }))

    isOffering.value = false

    if (!token.isCurrent()) {
      return
    }

    await applyAnswer(answer, candidate.draft)

    if (!token.isCurrent()) {
      return
    }

    await nextTick()
    focus.focusTitle()
  }

  const handleDropDraft = async (): Promise<void> => {
    const token = editor.captureSession()

    try {
      await drop()
    } catch (error) {
      session.report(error)
    }

    if (token.isCurrent()) {
      await nextTick()
      focus.focusTitle()
    }
  }

  watch(
    () => editor.key,
    () => {
      isOffering.value = false
    }
  )

  return { isOffering: shallowReadonly(isOffering), reserveOffer, handleOfferDraft, handleDropDraft }
}
