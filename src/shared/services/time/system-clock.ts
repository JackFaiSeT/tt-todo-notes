import type { IClock } from './types'

export class SystemClock implements IClock {
  now(): number {
    return Date.now()
  }
}
