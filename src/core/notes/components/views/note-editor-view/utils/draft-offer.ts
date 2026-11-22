import type { DialogOptions } from '@shared/stores/types'
import { formatDate, formatTime } from '@shared/utils/format-date'
import type { NNotes } from '@notes/domain'
import { DRAFT_OFFER_DIALOG } from '../constants/dialogs'
import type { DraftOfferContext } from '../types'

const toDetails = (recovery: NNotes.DraftRecovery, isCopy: boolean): string => {
  if (isCopy) {
    return DRAFT_OFFER_DIALOG.DETAILS_COPY
  }

  return recovery.hasConflict ? DRAFT_OFFER_DIALOG.DETAILS_CONFLICT : ''
}

export const toDraftOfferDialog = (
  { draft, recovery }: NNotes.DraftCandidate,
  { key, isDirty }: DraftOfferContext
): DialogOptions => {
  const isCopy = recovery.key !== key
  const summary = DRAFT_OFFER_DIALOG.DESCRIPTION(formatDate(draft.savedAt), formatTime(draft.savedAt))
  const replacement = isDirty ? DRAFT_OFFER_DIALOG.DETAILS_REPLACE : ''

  return {
    title: DRAFT_OFFER_DIALOG.TITLE,
    description: summary + toDetails(recovery, isCopy) + replacement + DRAFT_OFFER_DIALOG.RULES,
    acceptText: isCopy ? DRAFT_OFFER_DIALOG.ACCEPT_COPY : DRAFT_OFFER_DIALOG.ACCEPT,
    declineText: DRAFT_OFFER_DIALOG.DECLINE
  }
}
