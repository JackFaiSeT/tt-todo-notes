import { describe, expect, it, onTestFinished } from 'vitest'
import { effectScope, nextTick, shallowRef } from 'vue'
import { useScrollLock } from '@app/components/layout-modals/composables/useScrollLock'
import { stubDocumentRoot } from '../../../../../factories/document'

describe('App/useScrollLock', () => {
  it('should keep the page width and restore scrolling when the lock is released', async () => {
    const root = stubDocumentRoot()
    const isLocked = shallowRef<boolean>(false)
    const scope = effectScope()

    onTestFinished(() => scope.stop())
    scope.run(() => useScrollLock(isLocked))
    isLocked.value = true
    await nextTick()
    expect(root.style).toEqual({ overflow: 'hidden', paddingRight: '15px' })
    isLocked.value = false
    await nextTick()
    expect(root.style).toEqual({ overflow: '', paddingRight: '' })
  })
})
