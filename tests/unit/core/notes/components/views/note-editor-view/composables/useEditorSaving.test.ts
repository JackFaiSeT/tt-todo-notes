import { describe, it, expect, vi, onTestFinished } from 'vitest'
import { computed, effectScope } from 'vue'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { DIALOG_ANSWERS } from '@shared/constants/dialog'
import { useModalsStore } from '@shared/stores/useModalsStore'
import { useNotificationsStore } from '@shared/stores/useNotificationsStore'
import { NOTE_EDITOR_NOTIFICATIONS } from '@notes/components/views/note-editor-view/constants'
import type { EditorFocus, EditorNavigation } from '@notes/components/views/note-editor-view/types'
import { useEditorSaving } from '@notes/components/views/note-editor-view/composables/useEditorSaving'
import { createEditorScenario } from '../../../../../../../factories/editor-session'
import { createTitleOnlyContent } from '../../../../../../../factories/notes'

const setup = () => {
  const { actions, editor, report, api } = createEditorScenario()
  const scope = effectScope()

  const navigation = {
    replaceKey: vi.fn<EditorNavigation['replaceKey']>(async () => undefined),
    leave: vi.fn<EditorNavigation['leave']>(async () => undefined)
  }

  const focus = {
    focusTitle: vi.fn<EditorFocus['focusTitle']>(),
    focusHeading: vi.fn<EditorFocus['focusHeading']>(),
    focusRow: vi.fn<EditorFocus['focusRow']>(),
    getFocusedRowId: vi.fn<EditorFocus['getFocusedRowId']>()
  }

  const session = { ...actions, editor, report, candidate: computed(() => null) }
  const commands = scope.run(() => useEditorSaving({ session, navigation, focus }))!

  onTestFinished(() => scope.stop())

  return {
    commands,
    editor,
    actions,
    api,
    navigation,
    focus,
    dialogs: useModalsStore(),
    notifications: useNotificationsStore()
  }
}

describe('Notes/useEditorSaving', () => {
  it('should retain the working copy when discarding is declined', async () => {
    const { commands, editor, actions, navigation, dialogs } = setup()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Текст')

    const pending = commands.handleDiscard()

    dialogs.dialogs[0]!.answer(DIALOG_ANSWERS.DECLINE)
    await pending
    expect(editor.content.title).toBe('Текст')
    expect(navigation.leave).not.toHaveBeenCalled()
  })

  it('should ignore confirmation when the editor opened another session', async () => {
    const { commands, editor, actions, api, navigation, dialogs } = setup()
    const note = await api.create(createTitleOnlyContent('Первая'))

    await actions.open(note.id)

    const pending = commands.handleDiscard({ shouldDeleteNote: true })

    editor.openSession(NEW_DRAFT_KEY)
    dialogs.dialogs[0]!.answer(DIALOG_ANSWERS.ACCEPT)
    await pending
    expect(api.remove).not.toHaveBeenCalled()
    expect(navigation.leave).not.toHaveBeenCalled()
  })

  it('should return to the saved version and stay in the editor when discarding is confirmed', async () => {
    const { commands, editor, actions, api, navigation, focus, dialogs, notifications } = setup()
    const note = await api.create(createTitleOnlyContent('Сохранённая'))

    await actions.open(note.id)
    editor.inputTitle('Правка')

    const pending = commands.handleDiscard()

    dialogs.dialogs[0]!.answer(DIALOG_ANSWERS.ACCEPT)
    await pending
    expect(editor.content.title).toBe('Сохранённая')
    expect(editor.key).toBe(note.id)
    expect(editor.canUndo).toBe(false)
    expect(navigation.leave).not.toHaveBeenCalled()
    expect(focus.focusTitle).toHaveBeenCalledTimes(1)
    expect(notifications.notifications.map(({ text }) => text)).toEqual([NOTE_EDITOR_NOTIFICATIONS.DISCARDED])
  })

  it('should leave to the list when deletion is confirmed', async () => {
    const { commands, actions, api, navigation, dialogs } = setup()
    const note = await api.create(createTitleOnlyContent('Удаляемая'))

    await actions.open(note.id)

    const pending = commands.handleDiscard({ shouldDeleteNote: true })

    dialogs.dialogs[0]!.answer(DIALOG_ANSWERS.ACCEPT)
    await pending
    expect(api.remove).toHaveBeenCalledExactlyOnceWith(note.id)
    expect(navigation.leave).toHaveBeenCalledTimes(1)
  })

  it('should overwrite and navigate when the user confirms the conflict', async () => {
    const { commands, editor, actions, api, navigation, dialogs } = setup()
    const note = await api.create(createTitleOnlyContent('Исходная'))

    await actions.open(note.id)
    editor.inputTitle('Моя версия')
    await api.update(note.id, { title: 'Другая версия', todos: [], baseVersion: 1 })

    const pending = commands.handleSave()

    await vi.waitFor(() => expect(dialogs.dialogs).toHaveLength(1))
    dialogs.dialogs[0]!.answer(DIALOG_ANSWERS.ACCEPT)
    await pending
    expect(navigation.replaceKey).toHaveBeenCalledWith(note.id)
    expect((await api.get(note.id)).title).toBe('Моя версия')
  })

  it('should offer saving a copy when the note is deleted in another tab', async () => {
    const { editor, actions, api, navigation, dialogs } = setup()
    const note = await api.create(createTitleOnlyContent('План'))

    await actions.open(note.id)
    editor.inputTitle('Другой план')
    editor.markDeleted()
    await vi.waitFor(() => expect(dialogs.dialogs).toHaveLength(1))
    dialogs.dialogs[0]!.answer(DIALOG_ANSWERS.ACCEPT)
    await vi.waitFor(() => expect(navigation.replaceKey).toHaveBeenCalledTimes(1))
    expect(editor.key).not.toBe(note.id)
    expect(editor.content.title).toBe('Другой план')
  })
})
