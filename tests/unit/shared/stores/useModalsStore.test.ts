import { describe, expect, it } from 'vitest'
import { createPinia } from 'pinia'
import { DIALOG_ANSWERS } from '@shared/constants/dialog'
import { useModalsStore } from '@shared/stores/useModalsStore'

describe('Shared/ModalsStore', () => {
  it('should retain the earlier dialog when the top dialog is dismissed', async () => {
    const stack = useModalsStore(createPinia())
    const first = stack.choose({ title: 'Первый', description: '', acceptText: 'Да' })
    const second = stack.choose({ title: 'Второй', description: '', acceptText: 'Да' })

    stack.dialogs[1]!.answer(DIALOG_ANSWERS.DISMISS)
    expect(await second).toBe(DIALOG_ANSWERS.DISMISS)
    expect(stack.dialogs.map((dialog) => dialog.title)).toEqual(['Первый'])
    stack.dialogs[0]!.answer(DIALOG_ANSWERS.ACCEPT)
    await first
  })

  it('should dismiss every open dialog when the whole stack is closed', async () => {
    const stack = useModalsStore(createPinia())
    const first = stack.choose({ title: 'Первый', description: '', acceptText: 'Да' })
    const second = stack.confirm({ title: 'Второй', description: '', acceptText: 'Да' })

    stack.dismissAll()
    expect(await first).toBe(DIALOG_ANSWERS.DISMISS)
    expect(await second).toBe(false)
    expect(stack.hasDialogs).toBe(false)
  })

  it('should confirm only when the dialog is accepted', async () => {
    const stack = useModalsStore(createPinia())
    const accepted = stack.confirm({ title: '', description: '', acceptText: 'Да' })
    const declined = stack.confirm({ title: '', description: '', acceptText: 'Да' })

    stack.dialogs[1]!.answer(DIALOG_ANSWERS.DECLINE)
    stack.dialogs[0]!.answer(DIALOG_ANSWERS.ACCEPT)
    expect(await accepted).toBe(true)
    expect(await declined).toBe(false)
    expect(stack.hasDialogs).toBe(false)
  })

  it('should make the background inert only when an open dialog has taken focus', () => {
    const stack = useModalsStore(createPinia())

    void stack.choose({ title: '', description: '', acceptText: 'Да' })
    expect(stack.isBackgroundInert).toBe(false)
    stack.markFocused(stack.dialogs[0]!.id)
    expect(stack.isBackgroundInert).toBe(true)
    stack.dialogs[0]!.answer(DIALOG_ANSWERS.DISMISS)
    expect(stack.isBackgroundInert).toBe(false)
  })
})
