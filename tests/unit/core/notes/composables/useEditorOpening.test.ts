import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NEW_DRAFT_KEY, DRAFT_SCHEMA_VERSION } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import { EDITOR_STATUSES, SAVE_OUTCOMES } from '@notes/constants'
import { createEditorScenario } from '../../../../factories/editor-session'
import { createTitleOnlyContent, createNewDraft } from '../../../../factories/notes'

describe('Notes/useEditorOpening', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => vi.useRealTimers())

  it('should keep the saved note editable when its draft cannot be loaded', async () => {
    const { actions, api, editor, report } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('Сохранённая'))
    const failure = new Error('draft unavailable')

    api.draft.mockRejectedValueOnce(failure)
    await actions.open(note.id)
    expect(editor.status).toBe(EDITOR_STATUSES.READY)
    expect(editor.content.title).toBe(note.title)
    expect(editor.hasCandidate).toBe(false)
    expect(report).toHaveBeenCalledExactlyOnceWith(failure)
  })

  it('should restore a draft as new when its note is missing', async () => {
    const { api, editor, actions, service } = createEditorScenario()
    const absent = parseNoteId('absent')

    await api.putDraft(absent, {
      body: {
        draft: {
          schemaVersion: DRAFT_SCHEMA_VERSION,
          noteId: absent,
          baseVersion: 1,
          savedAt: 5,
          content: { title: 'Черновик', todos: [] },
          history: { undo: [], redo: [] }
        }
      }
    })

    await actions.open(absent)
    expect(editor.status).toBe(EDITOR_STATUSES.MISSING)
    await actions.restoreDraft((await service.draft(absent))!)
    expect(editor.key).toBe(NEW_DRAFT_KEY)
    expect(editor.isDirty).toBe(true)
    expect(await actions.save()).toMatchObject({ kind: SAVE_OUTCOMES.SAVED, note: { title: 'Черновик' } })
  })

  it('should keep the original draft when writing its recovered copy fails', async () => {
    const { actions, editor, api, service } = createEditorScenario()
    const key = parseNoteId('deleted')

    await api.putDraft(key, { body: { draft: { ...createNewDraft(), noteId: key, baseVersion: 1 } } })
    await actions.open(key)

    const original = await service.draft(key)

    api.putDraft.mockRejectedValueOnce(new Error('Нет связи'))

    expect(await actions.restoreDraft(original!)).toBe(NEW_DRAFT_KEY)
    expect(editor.content).toEqual(original?.content)
    expect(await service.draft(key)).toEqual(original)
  })

  it('should restore undo history when reopening a draft', async () => {
    const { editor, actions, service } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Аб')
    await actions.flushDraft()
    actions.close()
    await actions.open(NEW_DRAFT_KEY)
    expect(editor.hasCandidate).toBe(true)
    await actions.restoreDraft((await service.draft(NEW_DRAFT_KEY))!)
    expect(editor.stepHistory('undo')).toBe(true)
    expect(editor.content.title).toBe('')
    expect(editor.stepHistory('redo')).toBe(true)
    expect(editor.content.title).toBe('Аб')
  })

  it('should keep the new session when an earlier open finishes last', async () => {
    const { actions, editor, api } = createEditorScenario()
    const delayed = Promise.withResolvers<Awaited<ReturnType<typeof api.get>>>()
    const first = await api.create(createTitleOnlyContent('Первая'))
    const second = await api.create(createTitleOnlyContent('Вторая'))

    api.get.mockReturnValueOnce(delayed.promise)

    const opening = actions.open(first.id)

    await actions.open(second.id)
    delayed.resolve(first)
    await opening
    expect(editor.key).toBe(second.id)
    expect(editor.content.title).toBe('Вторая')
  })
})
