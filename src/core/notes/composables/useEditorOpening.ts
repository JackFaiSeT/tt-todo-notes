import type { DraftKey } from '@shared/contract/notes/ids'
import { SETTLED_STATUSES } from '@shared/constants/promise'
import type { SessionToken } from '@notes/stores/types'
import type { EditorSession } from '@notes/stores/useEditorStore'
import type { NNotes } from '@notes/domain'
import type { INotesService } from '@notes/service'
import type { UseEditorDraftSyncResult } from './useEditorDraftSync'

type Dependencies = {
  session: EditorSession
  notesService: INotesService
  draftSync: UseEditorDraftSyncResult
  loadNote: (key: DraftKey) => Promise<NNotes.Model | null>
  loadDraft: (key: DraftKey) => Promise<NNotes.Draft | null>
  report: NNotes.ErrorReport
}

export type UseEditorOpeningResult = {
  open: (key: DraftKey) => Promise<void>
  close: () => void
  toRecovery: (draft: NNotes.Draft) => NNotes.DraftRecovery
  restoreDraft: (draft: NNotes.Draft) => Promise<DraftKey | undefined>
}

export const useEditorOpening = ({
  session,
  notesService,
  draftSync,
  loadNote,
  loadDraft,
  report
}: Dependencies): UseEditorOpeningResult => {
  const open = async (key: DraftKey): Promise<void> => {
    const inflight = draftSync.reset()

    session.openSession(key)

    const token = session.captureSession()

    if (inflight) {
      await inflight
    }

    if (!token.isCurrent()) {
      return
    }

    const [note, draft] = await Promise.allSettled([loadNote(key), loadDraft(key)])

    if (!token.isCurrent()) {
      return
    }

    if (note.status === SETTLED_STATUSES.REJECTED) {
      session.markFailed()
      report(note.reason)

      return
    }

    const { value: model } = note

    if (draft.status === SETTLED_STATUSES.REJECTED) {
      session.applyLoaded(model, null)
      report(draft.reason)

      return
    }

    const { value: candidate } = draft

    session.applyLoaded(model, candidate)
  }

  const close = (): void => {
    session.commitInput()
    void draftSync.flushDraft()
    session.closeSession()
  }

  const toRecovery = (draft: NNotes.Draft): NNotes.DraftRecovery =>
    notesService.planDraftRecovery({ key: session.key, currentVersion: session.base?.version ?? null, draft })

  const dropOriginalDraft = async (key: DraftKey, token: SessionToken): Promise<void> => {
    try {
      await draftSync.dropDraft(key)
    } catch (error) {
      if (token.isCurrent()) {
        report(error)
      }
    }
  }

  const restoreDraft = async (draft: NNotes.Draft): Promise<DraftKey | undefined> => {
    const token = session.captureSession()
    const { key } = session
    const recovery = toRecovery(draft)

    session.restoreDraft(draft, recovery)

    if (recovery.key === key) {
      return undefined
    }

    const isRetained = await draftSync.retainDraft()

    if (!token.isCurrent()) {
      return undefined
    }

    if (isRetained) {
      await dropOriginalDraft(key, token)
    }

    return token.isCurrent() ? recovery.key : undefined
  }

  return { open, close, toRecovery, restoreDraft }
}
