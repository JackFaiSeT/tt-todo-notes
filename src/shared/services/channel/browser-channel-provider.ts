import type { ChannelHandler, IChannelProvider, Unsubscribe } from './types'

export class BrowserChannelProvider implements IChannelProvider {
  constructor(private readonly broadcastChannel: BroadcastChannel) {}

  send(value: unknown): void {
    this.broadcastChannel.postMessage(value)
  }

  subscribe(handle: ChannelHandler<unknown>): Unsubscribe {
    const onMessage = (event: MessageEvent<unknown>): void => handle(event.data)

    this.broadcastChannel.addEventListener('message', onMessage)

    return () => this.broadcastChannel.removeEventListener('message', onMessage)
  }

  close(): void {
    this.broadcastChannel.close()
  }
}
