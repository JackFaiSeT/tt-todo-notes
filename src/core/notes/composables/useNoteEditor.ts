import type { DraftKey } from '@shared/contract/notes/ids'
import { usePageLifecycle, useTimeClient } from '@shared/composables'
import { useNotificationsStore } from '@shared/stores/useNotificationsStore'
import { EDITOR_STATUSES, SAVE_OUTCOMES } from '@notes/constants'
import { useEditorStore, type EditorSession } from '@notes/stores/useEditorStore'
import { isSameContent } from '@notes/utils/content'
import { toHandedOffDraft, toUnsyncedDraft } from '@notes/utils/draft-recovery'
import { toNotesErrorText } from '@notes/utils/error-text'
import type { NNotes } from '@notes/domain'
import { useDraftResource, useNoteResource, useNotesListCache } from './api'
import { useEditorDraftSync, type UseEditorDraftSyncResult } from './useEditorDraftSync'
import { useEditorMutations, type UseEditorMutationsResult } from './useEditorMutations'
import { useEditorOpening, type UseEditorOpeningResult } from './useEditorOpening'
import { useNotesService } from './useNotesService'

export type UseNoteEditorResult = Pick<UseEditorOpeningResult, 'open' | 'restoreDraft'> &
  Pick<UseEditorDraftSyncResult, 'dropDraft' | 'retainDraft'> &
  UseEditorMutationsResult & {
    editor: EditorSession
    candidate: ComputedRef<NNotes.DraftCandidate | null>
    report: NNotes.ErrorReport
  }

export const useNoteEditor = (keySource: MaybeRefOrGetter<DraftKey>): UseNoteEditorResult => {
  const notesService = useNotesService()
  const timeClient = useTimeClient()
  const pageLifecycle = usePageLifecycle()
  const notifications = useNotificationsStore()
  const editor = useEditorStore()
  const noteResource = useNoteResource(keySource)
  const draftResource = useDraftResource(keySource)
  const listCache = useNotesListCache()

  const localCandidate = shallowRef<NNotes.Resource<NNotes.Draft> | null>(null)

  const report = (error: unknown): void => notifications.error(toNotesErrorText(error))

  const isLocalCandidateFor = (key: DraftKey): boolean => toValue(localCandidate)?.key === key

  const loadRemoteDraft = async (key: DraftKey, local: NNotes.Draft | null): Promise<NNotes.Draft | null> => {
    try {
      return await draftResource.load(key)
    } catch (error) {
      if (!local) {
        throw error
      }

      report(error)

      return null
    }
  }

  const loadDraft = async (key: DraftKey): Promise<NNotes.Draft | null> => {
    const local = notesService.readLocalDraft(key)
    const handedOff = local ? null : notesService.readHandedOffDraft(key)
    const remote = await loadRemoteDraft(key, local ?? handedOff)
    const unsynced = local ? toUnsyncedDraft(remote, local) : toHandedOffDraft(remote, handedOff)

    if (handedOff && !unsynced) {
      notesService.forgetHandedOffDraft(key)
    }

    localCandidate.value = unsynced ? { key, model: unsynced } : null

    return unsynced ?? remote
  }

  const draftSync = useEditorDraftSync({ session: editor, notesService, timeClient, report })

  const mutations = useEditorMutations({ session: editor, notesService, draftSync, report })

  const opening = useEditorOpening({
    session: editor,
    notesService,
    draftSync,
    report,
    loadNote: noteResource.load,
    loadDraft
  })

  const candidate = computed<NNotes.DraftCandidate | null>(() => {
    const resource = isLocalCandidateFor(editor.key) ? toValue(localCandidate) : toValue(draftResource.resource)

    return editor.hasCandidate && resource?.key === editor.key && resource.model
      ? { draft: resource.model, recovery: opening.toRecovery(resource.model) }
      : null
  })

  const toPendingRemoteDraft = (): NNotes.Draft | null => {
    const remote = toValue(draftResource.resource)

    return remote?.key === editor.key && remote.model && !isSameContent(remote.model.content, editor.content)
      ? remote.model
      : null
  }

  const restoreDraft = async (draft: NNotes.Draft): Promise<DraftKey | undefined> => {
    const isLocal = isLocalCandidateFor(editor.key)

    localCandidate.value = null

    const destination = await opening.restoreDraft(draft)

    if (isLocal && !destination && toPendingRemoteDraft()) {
      editor.holdCandidate()
    }

    return destination
  }

  const dropDraft = async (key?: DraftKey): Promise<void> => {
    if (key !== undefined || !isLocalCandidateFor(editor.key)) {
      await draftSync.dropDraft(key)

      return
    }

    notesService.keepLocalDraft(editor.key, null)
    localCandidate.value = null

    if (toPendingRemoteDraft()) {
      editor.holdCandidate()
    } else {
      editor.dismissCandidate()
    }
  }

  const save = async (options?: NNotes.SaveOptions): Promise<NNotes.SaveResult | undefined> => {
    const result = await mutations.save(options)

    if (result?.kind === SAVE_OUTCOMES.SAVED) {
      listCache.clear()
      noteResource.prime({ key: result.note.id, model: result.note })
      draftResource.prime({ key: result.note.id, model: null })
    }

    return result
  }

  const discard = async (options?: NNotes.DiscardOptions): Promise<boolean | undefined> => {
    const isDiscarded = await mutations.discard(options)

    if (isDiscarded && options?.shouldDeleteNote) {
      listCache.clear()
    }

    return isDiscarded
  }

  const stopHideListener = pageLifecycle.onHide(() => {
    void draftSync.flushDraft({ keepalive: true })
    notesService.handOffDraft(editor.key)
  })

  watch(noteResource.resource, (resource) => {
    if (resource?.key === editor.key) {
      editor.observeNote(resource.model)
    }
  })

  watch(draftResource.resource, (resource) => {
    if (resource?.key === editor.key && !isLocalCandidateFor(editor.key)) {
      editor.observeDraft(resource.model)
    }
  })

  watch(
    () => editor.hasCandidate,
    (hasCandidate) => {
      if (!hasCandidate) {
        localCandidate.value = null
      }
    }
  )

  watch([noteResource.error, draftResource.error], ([noteError, draftError]) => {
    if (editor.status === EDITOR_STATUSES.READY && (noteError || draftError)) {
      report(noteError ?? draftError)
    }
  })

  onScopeDispose(() => {
    stopHideListener()
    opening.close()
  })

  return {
    editor,
    candidate,
    report,
    open: opening.open,
    restoreDraft,
    dropDraft,
    retainDraft: draftSync.retainDraft,
    save,
    discard
  }
}
