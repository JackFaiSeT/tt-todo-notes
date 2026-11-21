import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { SAVE_OUTCOMES } from '@notes/constants'
import type { SessionToken } from '@notes/stores/types'
import type { EditorSession } from '@notes/stores/useEditorStore'
import type { NNotes } from '@notes/domain'
import type { INotesService } from '@notes/service'
import type { UseEditorDraftSyncResult } from './useEditorDraftSync'

type Dependencies = {
  session: EditorSession
  draftSync: UseEditorDraftSyncResult
  notesService: INotesService
  report: NNotes.ErrorReport
}

export type UseEditorMutationsResult = {
  save: (options?: NNotes.SaveOptions) => Promise<NNotes.SaveResult | undefined>
  discard: (options?: NNotes.DiscardOptions) => Promise<boolean | undefined>
}

export const useEditorMutations = ({
  session,
  draftSync,
  notesService,
  report
}: Dependencies): UseEditorMutationsResult => {
  const mutate = async <TResult>(action: (token: SessionToken) => Promise<TResult>): Promise<TResult | undefined> => {
    const token = session.startMutation()

    if (!token) {
      return undefined
    }

    try {
      await draftSync.pause()

      return token.isCurrent() ? await action(token) : undefined
    } finally {
      if (token.isCurrent()) {
        session.finishMutation()
        draftSync.resume()
      }
    }
  }

  const applySaveResult = async (result: NNotes.SaveResult): Promise<void> => {
    switch (result.kind) {
      case SAVE_OUTCOMES.SAVED:
        await draftSync.reset()
        session.applySaved(result.note)
        break
      case SAVE_OUTCOMES.DELETED:
        session.markDeleted()
        break
      case SAVE_OUTCOMES.CONFLICT:
        session.rejectVersion(result.latestVersion)
        break
    }
  }

  const requestSave = async (
    options: NNotes.SaveOptions,
    token: SessionToken
  ): Promise<NNotes.SaveResult | undefined> => {
    try {
      const result = await notesService.save({
        ...options,
        key: session.key,
        content: session.content,
        baseVersion: session.baseVersion,
        observedVersion: session.remoteVersion,
        hasRejectedVersion: session.hasRejectedVersion
      })

      if (!token.isCurrent()) {
        return undefined
      }

      await applySaveResult(result)

      return result
    } catch (error) {
      if (token.isCurrent()) {
        report(error)
      }

      return undefined
    }
  }

  const save = async (options: NNotes.SaveOptions = {}): Promise<NNotes.SaveResult | undefined> =>
    session.isValid ? mutate((token) => requestSave(options, token)) : undefined

  const discard = ({ shouldDeleteNote = false }: NNotes.DiscardOptions = {}): Promise<boolean | undefined> =>
    mutate(async (token) => {
      const key = session.key
      const isDeletion = shouldDeleteNote && key !== NEW_DRAFT_KEY

      if (isDeletion) {
        await notesService.remove(key)
      } else {
        await draftSync.dropDraft()
      }

      if (!token.isCurrent()) {
        return false
      }

      await draftSync.reset()

      if (isDeletion) {
        session.openSession(key)
      } else {
        session.revertSession()
      }

      return true
    })

  return { save, discard }
}
