import { describe, expect, it, vi } from 'vitest'
import { ChannelClient } from '@shared/services/channel'
import type { IChannelProvider } from '@shared/services/channel'

describe('Shared/ChannelClient', () => {
  it('should deliver a valid false value when the parser accepts it', () => {
    const provider = {
      send: vi.fn<IChannelProvider['send']>(),
      close: vi.fn<IChannelProvider['close']>(),
      subscribe: (handle: (value: unknown) => void) => {
        handle(false)

        return () => undefined
      }
    }

    const channel = new ChannelClient(provider, (value) => (typeof value === 'boolean' ? value : null))
    const receive = vi.fn<Parameters<typeof channel.subscribe>[0]>()

    channel.subscribe(receive)

    expect(receive).toHaveBeenCalledWith(false)
  })
})
