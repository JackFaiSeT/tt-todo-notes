export type Unsubscribe = () => void

export type ChannelHandler<TMessage> = (message: TMessage) => void

export type ChannelParser<TMessage> = (value: unknown) => TMessage | null

export interface IChannelProvider {
  send(value: unknown): void
  subscribe(handle: ChannelHandler<unknown>): Unsubscribe
  close(): void
}

export interface IChannelClient<TMessage> {
  publish(message: TMessage): void
  subscribe(handle: ChannelHandler<TMessage>): Unsubscribe
  close(): void
}
