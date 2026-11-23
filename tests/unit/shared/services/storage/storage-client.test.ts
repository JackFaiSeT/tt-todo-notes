import { describe, expect, it } from 'vitest'
import { StorageClient } from '@shared/services/storage'
import { MemoryStorageProvider } from '../../../../factories/storage'

const readNumber = (value: unknown): number => {
  if (typeof value !== 'number') {
    throw new TypeError('not a number')
  }

  return value
}

describe('Shared/StorageClient', () => {
  it('should read back a value when it was written', () => {
    const storage = new StorageClient(new MemoryStorageProvider())

    storage.write('count', 3)
    expect(storage.read('count', readNumber)).toBe(3)
  })

  it('should forget a stored value when it no longer passes validation', () => {
    const provider = new MemoryStorageProvider()
    const storage = new StorageClient(provider)

    storage.write('count', 'три')
    expect(storage.read('count', readNumber)).toBeNull()
    expect(provider.read('count')).toBeNull()
  })

  it('should return nothing when the value was removed', () => {
    const storage = new StorageClient(new MemoryStorageProvider())

    storage.write('count', 3)
    storage.remove('count')
    expect(storage.read('count', readNumber)).toBeNull()
  })
})
