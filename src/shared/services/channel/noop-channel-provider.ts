import type { IChannelProvider, Unsubscribe } from './types'

export class NoopChannelProvider implements IChannelProvider {
  send(): void {}

  subscribe(): Unsubscribe {
    return () => undefined
  }

  close(): void {}
}
