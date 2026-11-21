import { createId } from '@shared/contract/create-id'
import type { IIdProvider } from './types'

export class CryptoIdProvider implements IIdProvider {
  next(): string {
    return createId()
  }
}
