import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import type { DraftKey } from '@shared/contract/notes/ids'
import type { ITimeClient } from '@shared/services/time'
import { DRAFT_DELAY_MS, DRAFT_OUTCOMES, EDITOR_STATUSES } from '@notes/constants'
import type { SessionToken } from '@notes/stores/types'
import type { EditorSession } from '@notes/stores/useEditorStore'
import type { NNotes } from '@notes/domain'
import type { INotesService } from '@notes/service'

type Dependencies = {
  session: EditorSession
  notesService: INotesService
  timeClient: ITimeClient
  report: NNotes.ErrorReport
}

type FlushOptions = {
  keepalive?: boolean
}

export type UseEditorDraftSyncResult = {
  flushDraft: (options?: FlushOptions) => Promise<void>
  dropDraft: (key?: DraftKey) => Promise<void>
  retainDraft: () => Promise<boolean>
  pause: () => Promise<void> | undefined
  reset: () => Promise<void> | undefined
  resume: () => void
}

export const useEditorDraftSync = ({
  session,
  notesService,
  timeClient,
  report
}: Dependencies): UseEditorDraftSyncResult => {
  let hasPending = false
  let inflight: Promise<void> | undefined

  const timer = timeClient.debounce(DRAFT_DELAY_MS, () => {
    void flushDraft()
  })

  const pause = (): Promise<void> | undefined => {
    timer.cancel()

    return inflight
  }

  const reset = (): Promise<void> | undefined => {
    hasPending = false

    return pause()
  }

  const resume = (): void => {
    if (hasPending) {
      timer.schedule()
    }
  }

  const toDraft = (): NNotes.Draft | null =>
    session.isDirty
      ? {
          noteId: session.key === NEW_DRAFT_KEY ? null : session.key,
          baseVersion: session.baseVersion,
          content: session.content,
          history: session.serializeHistory(),
          savedAt: timeClient.now()
        }
      : null

  const applyResult = (result: NNotes.DraftResult, token: SessionToken): void => {
    if (!token.isCurrent() || result.kind === DRAFT_OUTCOMES.WRITTEN) {
      return
    }

    hasPending = true

    if (result.kind === DRAFT_OUTCOMES.DELETED) {
      session.markDeleted()

      return
    }

    session.observeNote(result.latest)

    if (result.shouldRetry && session.isDirty) {
      timer.schedule()
    }
  }

  const writeDraft = async (request: NNotes.DraftWriteRequest, previous: Promise<void> | undefined): Promise<void> => {
    const token = session.captureSession()

    try {
      if (previous) {
        await previous
      }

      applyResult(await notesService.saveDraft(request), token)
    } catch (error) {
      if (!token.isCurrent()) {
        return
      }

      hasPending = true
      report(error)
    }
  }

  const flushDraft = ({ keepalive = false }: FlushOptions = {}): Promise<void> => {
    const previous = pause()

    if (!hasPending || session.status !== EDITOR_STATUSES.READY) {
      return previous ?? Promise.resolve()
    }

    const draft = toDraft()

    notesService.keepLocalDraft(session.key, draft)

    if (session.isBusy || session.isDeleted || session.hasCandidate) {
      return previous ?? Promise.resolve()
    }

    hasPending = false

    const request = { key: session.key, draft, observedVersion: session.remoteVersion, keepalive }

    const work = writeDraft(request, previous).finally(() => {
      if (inflight === work) {
        inflight = undefined
      }
    })

    inflight = work

    return work
  }

  const retainDraft = async (): Promise<boolean> => {
    await flushDraft()

    return !hasPending && !session.isDeleted && !session.hasCandidate
  }

  const dropDraft = async (key: DraftKey = session.key): Promise<void> => {
    const token = session.captureSession()

    await notesService.removeDraft(key)

    if (token.isCurrent() && key === session.key) {
      session.dismissCandidate()
    }
  }

  watch(
    () => session.revision,
    () => {
      hasPending = true
      timer.schedule()
    },
    { flush: 'sync' }
  )

  watch(
    () => session.hasCandidate,
    (hasCandidate) => {
      if (!hasCandidate) {
        resume()
      }
    }
  )

  return { flushDraft, dropDraft, retainDraft, pause, resume, reset }
}
