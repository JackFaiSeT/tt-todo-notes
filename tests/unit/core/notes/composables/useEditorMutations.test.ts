import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTP_STATUS, ERROR_CODES } from '@shared/contract/http'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { HTTP_ERROR_KINDS } from '@shared/constants/http'
import { HttpError } from '@shared/services/http'
import { CHANGE_TYPES, DRAFT_DELAY_MS, EDITOR_STATUSES, SAVE_OUTCOMES } from '@notes/constants'
import { createEditorScenario } from '../../../../factories/editor-session'
import { createTitleOnlyContent } from '../../../../factories/notes'

describe('Notes/useEditorMutations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => vi.useRealTimers())

  it('should retain local edits when saving fails', async () => {
    const { api, editor, actions, report } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('База'))

    await actions.open(note.id)
    editor.inputTitle('Моя версия')

    const failure = new Error('Нет связи')

    api.update.mockRejectedValueOnce(failure)
    expect(await actions.save()).toBeUndefined()
    expect(report).toHaveBeenCalledExactlyOnceWith(failure)
    expect(editor.isDirty).toBe(true)
    expect(editor.isBusy).toBe(false)
    expect(editor.content.title).toBe('Моя версия')
  })

  it('should save a copy when the note was deleted elsewhere', async () => {
    const { api, editor, actions, service } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('План'))

    await actions.open(note.id)
    editor.inputTitle('Другой план')
    await api.remove(note.id)
    editor.observeNote(await service.get(note.id))
    expect(editor.isDeleted).toBe(true)

    const copy = await actions.save({ isCopy: true })

    expect(copy).toMatchObject({ kind: SAVE_OUTCOMES.SAVED, note: { title: 'Другой план' } })
    expect(editor.key).not.toBe(note.id)
    expect(await service.get(note.id)).toBeNull()
    await actions.open(note.id)
    expect(editor.status).toBe(EDITOR_STATUSES.MISSING)
  })

  it('should persist normalized changes when the user saves', async () => {
    const { api, editor, actions } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    expect(editor.isValid).toBe(false)
    editor.inputTitle('  Набросок ')

    const item = editor.addTodo()!

    editor.inputTodo(item, ' текст ')
    editor.toggleTodo(item)
    expect(editor.isDirty).toBe(true)
    expect(api.create).not.toHaveBeenCalled()

    const result = await actions.save()

    expect(result).toMatchObject({
      kind: SAVE_OUTCOMES.SAVED,
      note: {
        title: 'Набросок',
        todos: [{ id: item, text: 'текст', done: true }]
      }
    })

    expect(api.create).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(DRAFT_DELAY_MS * 2)
    expect(api.putDraft).not.toHaveBeenCalled()
    expect(await api.draft(NEW_DRAFT_KEY)).toBeNull()
  })

  it('should not call the API when the content cannot be saved', async () => {
    const { api, editor, actions } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Есть название')
    editor.addTodo()
    expect(await actions.save()).toBeUndefined()
    expect(api.create).not.toHaveBeenCalled()
  })

  it('should mark the note deleted when the server no longer has it during saving', async () => {
    const { api, editor, actions } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('База'))

    await actions.open(note.id)
    editor.inputTitle('Правка')

    api.update.mockRejectedValueOnce(
      new HttpError({
        kind: HTTP_ERROR_KINDS.RESPONSE,
        status: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.NOTE_NOT_FOUND
      })
    )

    expect(await actions.save()).toEqual({ kind: SAVE_OUTCOMES.DELETED })
    expect(editor.isDeleted).toBe(true)
    expect(editor.content.title).toBe('Правка')
  })

  it('should start a fresh history when a note is saved', async () => {
    const { actions, editor } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Текст')
    await actions.save()
    expect(editor.isDirty).toBe(false)
    expect(editor.canUndo).toBe(false)
  })

  it('should broadcast the assigned ID when a new note is saved', async () => {
    const { actions, editor, broadcast } = createEditorScenario()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Текст')

    await actions.save()

    expect(broadcast).toHaveBeenCalledWith({ type: CHANGE_TYPES.SAVED, id: editor.key })
  })

  it('should update the same note when saving an existing session', async () => {
    const { actions, editor, api } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('База'))

    await actions.open(note.id)
    editor.inputTitle('Изменено')

    expect(await actions.save()).toMatchObject({
      kind: SAVE_OUTCOMES.SAVED,
      note: { id: note.id, title: 'Изменено', version: 2 }
    })
  })

  it('should return to the saved version and delete the draft when edits are discarded', async () => {
    const { editor, actions, api } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('База'))

    await actions.open(note.id)
    editor.inputTitle('Правка')
    await actions.flushDraft()
    expect(await actions.discard()).toBe(true)
    expect(editor.key).toBe(note.id)
    expect(editor.status).toBe(EDITOR_STATUSES.READY)
    expect(editor.content.title).toBe('База')
    expect(editor.canUndo).toBe(false)
    expect(await api.draft(note.id)).toBeNull()
    await vi.advanceTimersByTimeAsync(DRAFT_DELAY_MS * 2)
    expect(await api.draft(note.id)).toBeNull()
  })

  it('should delete the note and notify other tabs when deletion is confirmed', async () => {
    const { actions, api, service, broadcast } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('Удаляемая'))

    await actions.open(note.id)
    expect(await actions.discard({ shouldDeleteNote: true })).toBe(true)
    expect(await service.get(note.id)).toBeNull()
    expect(broadcast).toHaveBeenCalledWith({ type: CHANGE_TYPES.DELETED, id: note.id })
  })

  it('should require confirmation when saving against a newer version', async () => {
    const { api, editor, actions } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('База'))

    await actions.open(note.id)
    editor.inputTitle('Моя версия')
    await api.update(note.id, { title: 'Чужая версия', todos: [], baseVersion: 1 })
    expect(await actions.save()).toEqual({ kind: SAVE_OUTCOMES.CONFLICT, latestVersion: 2 })
    expect(editor.hasConflict).toBe(true)
    expect(editor.content.title).toBe('Моя версия')
    expect(await actions.save({ isForced: true })).toMatchObject({ note: { version: 3 } })
  })

  it('should ask again when another version is saved before the overwrite is confirmed', async () => {
    const { api, editor, actions } = createEditorScenario()
    const note = await api.create(createTitleOnlyContent('База'))

    await actions.open(note.id)
    editor.inputTitle('Моя версия')
    await api.update(note.id, { title: 'Вторая', todos: [], baseVersion: 1 })
    await actions.save()
    await api.update(note.id, { title: 'Третья', todos: [], baseVersion: 2 })

    expect(await actions.save({ isForced: true })).toEqual({ kind: SAVE_OUTCOMES.CONFLICT, latestVersion: 3 })
    expect((await api.get(note.id)).title).toBe('Третья')
    expect(await actions.save({ isForced: true })).toMatchObject({ note: { version: 4, title: 'Моя версия' } })
  })
})
