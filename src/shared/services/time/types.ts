export type CancelTimer = () => void

export type DelayedWrite = {
  schedule: () => void
  cancel: () => void
  flush: () => void
}

export interface IClock {
  now(): number
}

export interface ITimer {
  after(delay: number, callback: () => void): CancelTimer
}

export interface ITimeClient extends ITimer, IClock {
  debounce(delay: number, write: () => void): DelayedWrite
}
