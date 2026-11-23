import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { NOTIFICATION_DURATIONS_MS, NOTIFICATION_KINDS, NOTIFICATIONS_LIMIT } from '@shared/constants/notifications'
import { useNotificationsStore } from '@shared/stores/useNotificationsStore'
import { BrowserTimer, TimeClient } from '@shared/services/time'
import { stubNuxtApp } from '../../../factories/nuxt-app'

const setup = () => {
  stubNuxtApp({ $timeClient: new TimeClient({ now: () => Date.now() }, new BrowserTimer()) })

  return useNotificationsStore(createPinia())
}

const texts = (store: ReturnType<typeof useNotificationsStore>) => store.notifications.map(({ text }) => text)

describe('Shared/NotificationsStore', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it.each([NOTIFICATION_KINDS.SUCCESS, NOTIFICATION_KINDS.ERROR])(
    'should hide a %s message when its display time ends',
    (kind) => {
      const store = setup()

      store[kind]('Сообщение')
      vi.advanceTimersByTime(NOTIFICATION_DURATIONS_MS[kind] - 1)
      expect(texts(store)).toEqual(['Сообщение'])
      vi.advanceTimersByTime(1)
      expect(texts(store)).toEqual([])
    }
  )

  it('should keep only the newest messages when more arrive than fit', () => {
    const store = setup()

    for (let index = 0; index <= NOTIFICATIONS_LIMIT; index++) {
      store.success(`Сообщение ${index}`)
    }

    expect(texts(store)).toEqual(Array.from({ length: NOTIFICATIONS_LIMIT }, (_, index) => `Сообщение ${index + 1}`))
  })

  it('should show a message once and restart its timer when it repeats', () => {
    const store = setup()

    store.error('Нет связи')
    vi.advanceTimersByTime(NOTIFICATION_DURATIONS_MS.error - 10)
    store.error('Нет связи')
    vi.advanceTimersByTime(20)
    expect(texts(store)).toEqual(['Нет связи'])
  })

  it('should hide messages a full display time later when they were paused and resumed', () => {
    const store = setup()

    store.success('Сохранено')
    vi.advanceTimersByTime(NOTIFICATION_DURATIONS_MS.success - 1)
    store.pause()
    store.error('Нет связи')
    vi.advanceTimersByTime(NOTIFICATION_DURATIONS_MS.error * 2)
    expect(texts(store)).toEqual(['Сохранено', 'Нет связи'])
    store.resume()
    vi.advanceTimersByTime(NOTIFICATION_DURATIONS_MS.success - 1)
    expect(texts(store)).toEqual(['Сохранено', 'Нет связи'])
    vi.advanceTimersByTime(1)
    expect(texts(store)).toEqual(['Нет связи'])
    vi.advanceTimersByTime(NOTIFICATION_DURATIONS_MS.error - NOTIFICATION_DURATIONS_MS.success)
    expect(texts(store)).toEqual([])
  })

  it('should remove a dismissed message and not fail when its timer would have fired', () => {
    const store = setup()

    store.success('Сохранено')

    const [notification] = store.notifications

    store.dismiss(notification!.id)
    store.success('Удалено')
    vi.advanceTimersByTime(NOTIFICATION_DURATIONS_MS.success - 1)
    expect(texts(store)).toEqual(['Удалено'])
  })
})
