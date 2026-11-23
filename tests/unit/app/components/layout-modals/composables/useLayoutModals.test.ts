import { describe, expect, it } from 'vitest'
import { nextTick, toValue } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useLayoutModals } from '@app/components/layout-modals/composables/useLayoutModals'
import { DIALOG_ANSWERS } from '@shared/constants/dialog'
import { useModalsStore } from '@shared/stores/useModalsStore'
import { stubDocumentRoot } from '../../../../../factories/document'
import { stubRoute } from '../../../../../factories/nuxt-app'

describe('App/useLayoutModals', () => {
  it('should dismiss the open dialogs when the page changes', async () => {
    setActivePinia(createPinia())
    stubDocumentRoot()

    const route = stubRoute('/notes/a')
    const stack = useModalsStore()

    useLayoutModals()

    const answer = stack.choose({ title: '', description: '', acceptText: 'Удалить' })

    route.path = '/'
    await nextTick()
    expect(await answer).toBe(DIALOG_ANSWERS.DISMISS)
    expect(stack.hasDialogs).toBe(false)
  })

  it('should disable the earlier dialog only when the new dialog has received focus', async () => {
    setActivePinia(createPinia())
    stubDocumentRoot()
    stubRoute('/')

    const stack = useModalsStore()
    const host = useLayoutModals()
    const options = { title: '', description: '', acceptText: 'Да' }
    const first = stack.choose(options)
    const second = stack.choose(options)
    const lower = stack.dialogs[0]!
    const upper = stack.dialogs[1]!

    host.onFocused(lower.id)
    expect(toValue(host.layers).map((layer) => layer.isInert)).toEqual([false, false])
    host.onFocused(upper.id)
    expect(toValue(host.layers).map((layer) => layer.isInert)).toEqual([true, false])
    upper.answer(DIALOG_ANSWERS.DISMISS)
    expect(toValue(host.layers)).toEqual([{ dialog: lower, isTop: true, isInert: false }])
    lower.answer(DIALOG_ANSWERS.ACCEPT)
    await Promise.all([first, second])
  })
})
