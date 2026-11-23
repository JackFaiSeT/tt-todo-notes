import type { ChannelHandler, ChannelParser, IChannelClient, IChannelProvider, Unsubscribe } from './types'

export class ChannelClient<TMessage> implements IChannelClient<TMessage> {
  constructor(
    private readonly channelProvider: IChannelProvider,
    private readonly channelParser: ChannelParser<TMessage>
  ) {}

  publish(message: TMessage): void {
    this.channelProvider.send(message)
  }

  subscribe(handle: ChannelHandler<TMessage>): Unsubscribe {
    return this.channelProvider.subscribe((value) => {
      const message = this.channelParser(value)

      if (message !== null) {
        handle(message)
      }
    })
  }

  close(): void {
    this.channelProvider.close()
  }
}
