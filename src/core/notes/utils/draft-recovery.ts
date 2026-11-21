import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import type { NNotes } from '@notes/domain'
import { isSameContent } from './content'

export const toUnsyncedDraft = (remote: NNotes.Draft | null, local: NNotes.Draft | null): NNotes.Draft | null =>
  local && (!remote || !isSameContent(local.content, remote.content)) ? local : null

export const toHandedOffDraft = (remote: NNotes.Draft | null, handedOff: NNotes.Draft | null): NNotes.Draft | null =>
  handedOff && (!remote || (handedOff.savedAt > remote.savedAt && !isSameContent(handedOff.content, remote.content)))
    ? handedOff
    : null

export const toDraftRecovery = ({ key, currentVersion, draft }: NNotes.RecoveryRequest): NNotes.DraftRecovery => {
  if (key !== NEW_DRAFT_KEY && currentVersion === null) {
    return { key: NEW_DRAFT_KEY, baseVersion: null, hasConflict: false }
  }

  return {
    key,
    baseVersion: draft.baseVersion,
    hasConflict: draft.baseVersion !== null && draft.baseVersion !== currentVersion
  }
}
