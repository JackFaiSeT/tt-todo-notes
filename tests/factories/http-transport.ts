import { vi } from 'vitest'
import type { HttpTransport } from '@shared/services/http'

export const createHttpTransport = () => {
  const port: { send: HttpTransport } = {
    send: async () => {
      throw new Error('Unexpected HTTP request')
    }
  }

  const calls = vi.spyOn(port, 'send').mockResolvedValue(undefined)

  return { port, calls }
}
