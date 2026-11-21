import type { CancelTimer, DelayedWrite, IClock, ITimeClient, ITimer } from './types'

export class TimeClient implements ITimeClient {
  constructor(
    private readonly clock: IClock,
    private readonly timer: ITimer
  ) {}

  now(): number {
    return this.clock.now()
  }

  after(delay: number, callback: () => void): CancelTimer {
    return this.timer.after(delay, callback)
  }

  debounce(delay: number, write: () => void): DelayedWrite {
    let stop: CancelTimer | undefined

    const cancel = (): void => {
      stop?.()
      stop = undefined
    }

    const flush = (): void => {
      if (!stop) {
        return
      }

      cancel()
      write()
    }

    const schedule = (): void => {
      cancel()
      stop = this.timer.after(delay, flush)
    }

    return { schedule, cancel, flush }
  }
}
