import { describe, expect, it, onTestFinished } from 'vitest'
import { computed, effectScope } from 'vue'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { DIALOG_ANSWERS } from '@shared/constants/dialog'
import type { DialogAnswer } from '@shared/stores/types'
import { useModalsStore } from '@shared/stores/useModalsStore'
import { useEditorLeaving } from '@notes/components/views/note-editor-view/composables/useEditorLeaving'
import { createEditorScenario } from '../../../../../../../factories/editor-session'

const setup = () => {
  const { actions, editor, report, api } = createEditorScenario()
  const scope = effectScope()
  const session = { ...actions, editor, report, candidate: computed(() => null) }
  const { canLeave } = scope.run(() => useEditorLeaving(session))!

  onTestFinished(() => scope.stop())

  return { canLeave, actions, editor, api, dialogs: useModalsStore() }
}

const answerLeave = async (dialogs: ReturnType<typeof useModalsStore>, answer: DialogAnswer) => {
  await Promise.resolve()
  dialogs.dialogs.at(-1)!.answer(answer)
}

describe('Notes/useEditorLeaving', () => {
  it('should leave without asking when nothing is edited', async () => {
    const { canLeave, actions, dialogs } = setup()

    await actions.open(NEW_DRAFT_KEY)
    expect(await canLeave()).toBe(true)
    expect(dialogs.hasDialogs).toBe(false)
  })

  it('should stay when the leave is confirmed but the draft cannot be written', async () => {
    const { canLeave, actions, editor, api, dialogs } = setup()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Несохранённое')
    api.putDraft.mockRejectedValueOnce(new Error('Нет связи'))

    const leaving = canLeave()

    await answerLeave(dialogs, DIALOG_ANSWERS.ACCEPT)
    expect(await leaving).toBe(false)
    expect(editor.content.title).toBe('Несохранённое')
  })

  it('should leave with the draft saved when the leave is confirmed', async () => {
    const { canLeave, actions, editor, api, dialogs } = setup()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Несохранённое')

    const leaving = canLeave()

    await answerLeave(dialogs, DIALOG_ANSWERS.ACCEPT)
    expect(await leaving).toBe(true)
    expect((await api.draft(NEW_DRAFT_KEY))?.content.title).toBe('Несохранённое')
  })

  it('should stay when the user declines to leave', async () => {
    const { canLeave, actions, editor, dialogs } = setup()

    await actions.open(NEW_DRAFT_KEY)
    editor.inputTitle('Несохранённое')

    const leaving = canLeave()

    await answerLeave(dialogs, DIALOG_ANSWERS.DECLINE)
    expect(await leaving).toBe(false)
  })
})
