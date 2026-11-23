import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, shallowRef } from 'vue'
import { LOADING_MIN_VISIBLE_MS } from '@shared/constants/loading'
import { useMinimumPending } from '@shared/composables/useMinimumPending'
import { BrowserTimer, TimeClient } from '@shared/services/time'
import { stubNuxtApp } from '../../../factories/nuxt-app'

const setup = (isInitiallyLoading: boolean) => {
  stubNuxtApp({ $timeClient: new TimeClient({ now: () => Date.now() }, new BrowserTimer()) })

  const source = shallowRef<boolean>(isInitiallyLoading)
  const scope = effectScope()
  const result = scope.run(() => useMinimumPending(source))!

  return { source, scope, ...result }
}

describe('Shared/useMinimumPending', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('should keep the loading state for the minimum time when data arrives early', async () => {
    const { source, isPending } = setup(true)

    vi.advanceTimersByTime(100)
    source.value = false
    await vi.advanceTimersByTimeAsync(LOADING_MIN_VISIBLE_MS - 101)
    expect(isPending.value).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    expect(isPending.value).toBe(false)
  })

  it('should settle at once when loading took longer than the minimum', async () => {
    const { source, isPending } = setup(true)

    vi.advanceTimersByTime(LOADING_MIN_VISIBLE_MS + 50)
    source.value = false
    await vi.advanceTimersByTimeAsync(0)
    expect(isPending.value).toBe(false)
  })

  it('should not show a loading state when data is already available', async () => {
    const { isPending, whenSettled } = setup(false)

    expect(isPending.value).toBe(false)
    await expect(whenSettled()).resolves.toBeUndefined()
  })

  it('should resolve waiters when the loading state ends', async () => {
    const { source, whenSettled } = setup(true)
    const settled = vi.fn<() => void>()

    void whenSettled().then(settled)
    source.value = false
    await vi.advanceTimersByTimeAsync(LOADING_MIN_VISIBLE_MS - 1)
    expect(settled).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(settled).toHaveBeenCalledTimes(1)
  })

  it('should resolve waiters when the owner is disposed', async () => {
    const { scope, whenSettled } = setup(true)
    const settled = vi.fn<() => void>()

    void whenSettled().then(settled)
    scope.stop()
    await vi.advanceTimersByTimeAsync(0)
    expect(settled).toHaveBeenCalledTimes(1)
  })
})
