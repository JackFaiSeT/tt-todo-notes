import type { CancelTimer, ITimer } from './types'

export class BrowserTimer implements ITimer {
  after(delay: number, callback: () => void): CancelTimer {
    const handle = setTimeout(callback, delay)

    return () => clearTimeout(handle)
  }
}
