import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTP_STATUS, ERROR_CODES } from '@shared/contract/http'
import { DRAFT_SCHEMA_VERSION, OPERATION_TYPES, NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { HTTP_ERROR_KINDS } from '@shared/constants/http'
import { HttpError } from '@shared/services/http'
import { DRAFT_DELAY_MS } from '@notes/constants'
import { createEditorScenario } from '../../../../factories/editor-session'
import { createTitleOnlyContent } from '../../../../factories/notes'

describe('Notes/useEditorDraftSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => vi.useRealTimers())

  it('should retain the draft on the next attempt when the first write fails', async () => {
    const { api, editor, actions } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Мой текст')
    api.putDraft.mockRejectedValueOnce(new Error('Нет связи'))
    expect(await actions.retainDraft()).toBe(false)
    expect(editor.content.title).toBe('Мой текст')
    expect(await actions.retainDraft()).toBe(true)
    expect((await api.draft(NEW_DRAFT_KEY))?.content.title).toBe('Мой текст')
  })

  it('should coalesce draft writes when edits continue before the deadline', async () => {
    const { api, editor, actions } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('А')
    vi.advanceTimersByTime(200)
    editor.inputTitle('Аб')
    await vi.advanceTimersByTimeAsync(DRAFT_DELAY_MS - 1)
    expect(api.putDraft).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(api.putDraft).toHaveBeenCalledTimes(1)

    expect(await api.draft(NEW_DRAFT_KEY)).toMatchObject({
      content: { title: 'Аб' },
      history: { undo: [{ type: OPERATION_TYPES.TITLE, before: '', after: 'Аб' }], redo: [] }
    })
  })

  it('should send pending text with keepalive when the draft is flushed for a hiding page', async () => {
    const { api, editor, actions } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Текст')
    await actions.flushDraft({ keepalive: true })

    expect(api.putDraft.mock.calls[0]).toMatchObject({
      0: NEW_DRAFT_KEY,
      1: {
        body: {
          draft: {
            schemaVersion: DRAFT_SCHEMA_VERSION,
            savedAt: 200,
            history: { undo: [{ type: OPERATION_TYPES.TITLE, before: '', after: 'Текст' }] }
          }
        },
        keepalive: true
      }
    })
  })

  it('should remove the draft when undo returns to the baseline', async () => {
    const { editor, actions, api } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Текст')
    await actions.flushDraft()
    editor.stepHistory('undo')
    await vi.advanceTimersByTimeAsync(DRAFT_DELAY_MS)
    expect(api.removeDraft).toHaveBeenCalledTimes(1)
    expect(await api.draft(NEW_DRAFT_KEY)).toBeNull()
  })

  it('should rewrite the local draft when a newer version clears it', async () => {
    const { api, editor, actions, service } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('База'))

    await actions.open(note.id)
    editor.inputTitle('Мой текст')
    await actions.flushDraft()
    await api.update(note.id, { title: 'Вторая вкладка', todos: [], baseVersion: 1 })
    editor.observeNote(await service.get(note.id))
    await vi.advanceTimersByTimeAsync(DRAFT_DELAY_MS)
    expect((await api.draft(note.id))?.content.title).toBe('Мой текст')
    expect(editor.hasConflict).toBe(true)
  })

  it('should rewrite the draft against the latest version when the server rejects a stale draft', async () => {
    const { api, editor, actions } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('База'))

    await actions.open(note.id)
    await api.update(note.id, { title: 'Вторая вкладка', todos: [], baseVersion: 1 })
    editor.inputTitle('Мой текст')

    api.putDraft.mockRejectedValueOnce(
      new HttpError({
        kind: HTTP_ERROR_KINDS.RESPONSE,
        status: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.VERSION_CONFLICT
      })
    )

    await actions.flushDraft()
    expect(editor.hasConflict).toBe(true)
    await vi.advanceTimersByTimeAsync(DRAFT_DELAY_MS)
    expect(api.putDraft).toHaveBeenCalledTimes(2)

    expect(api.putDraft.mock.calls[1]?.[1].body).toMatchObject({
      observedVersion: 2,
      draft: { baseVersion: 1, content: { title: 'Мой текст' } }
    })
  })

  it('should keep an earlier draft untouched when its offer is unresolved', async () => {
    const { api, editor, actions } = createEditorScenario()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)
    editor.inputTitle('Прежний черновик')
    await actions.flushDraft()
    await actions.open(NEW_DRAFT_KEY)
    expect(editor.hasCandidate).toBe(true)
    editor.inputTitle('Новый ввод')
    await vi.advanceTimersByTimeAsync(DRAFT_DELAY_MS * 2)
    expect(await actions.retainDraft()).toBe(false)
    expect((await api.draft(NEW_DRAFT_KEY))?.content.title).toBe('Прежний черновик')
  })

  it('should write the current edits when the earlier draft is deleted', async () => {
    const { api, editor, actions } = createEditorScenario()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)
    editor.inputTitle('Прежний черновик')
    await actions.flushDraft()
    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Новый ввод')
    await actions.dropDraft()
    await vi.advanceTimersByTimeAsync(DRAFT_DELAY_MS)
    expect((await api.draft(NEW_DRAFT_KEY))?.content.title).toBe('Новый ввод')
  })

  it('should mark the note deleted when the server rejects a draft for a missing note', async () => {
    const { api, editor, actions } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('База'))

    await actions.open(note.id)
    editor.inputTitle('Правка')

    api.putDraft.mockRejectedValueOnce(
      new HttpError({
        kind: HTTP_ERROR_KINDS.RESPONSE,
        status: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.NOTE_NOT_FOUND
      })
    )

    expect(await actions.retainDraft()).toBe(false)
    expect(editor.isDeleted).toBe(true)
  })

  it('should keep new edits in the tab when the server draft waits for a decision', async () => {
    const { api, editor, actions, service } = createEditorScenario()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)
    editor.inputTitle('Прежний черновик')
    await actions.flushDraft()
    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Новые правки')
    await actions.flushDraft()

    expect((await api.draft(NEW_DRAFT_KEY))?.content.title).toBe('Прежний черновик')
    expect(service.readLocalDraft(NEW_DRAFT_KEY)?.content.title).toBe('Новые правки')
  })

  it('should keep the last edits in the tab when the server write fails', async () => {
    const { api, editor, actions, service } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Перед закрытием')
    api.putDraft.mockRejectedValueOnce(new Error('Нет связи'))
    await actions.flushDraft({ keepalive: true })

    expect(await api.draft(NEW_DRAFT_KEY)).toBeNull()
    expect(service.readLocalDraft(NEW_DRAFT_KEY)?.content.title).toBe('Перед закрытием')
  })

  it.each([
    { name: 'saved', finish: (actions: ReturnType<typeof createEditorScenario>['actions']) => actions.save() },
    { name: 'discarded', finish: (actions: ReturnType<typeof createEditorScenario>['actions']) => actions.discard() }
  ])('should forget the tab copy when the edits are $name', async ({ finish }) => {
    const { editor, actions, service } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Готово')
    await actions.flushDraft()
    await finish(actions)

    expect(service.readLocalDraft(NEW_DRAFT_KEY)).toBeNull()
  })
})
