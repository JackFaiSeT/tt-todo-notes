import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { SystemClock, BrowserTimer, TimeClient } from '@shared/services/time'

describe('Shared/TimeClient', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('should coalesce writes when scheduling and flushing', () => {
    const write = vi.fn<Parameters<TimeClient['debounce']>[1]>()
    const queue = new TimeClient(new SystemClock(), new BrowserTimer()).debounce(800, write)

    queue.schedule()
    vi.advanceTimersByTime(600)
    queue.schedule()
    vi.advanceTimersByTime(750)
    expect(write).not.toHaveBeenCalled()
    queue.flush()
    vi.advanceTimersByTime(800)
    expect(write).toHaveBeenCalledTimes(1)
  })
})
