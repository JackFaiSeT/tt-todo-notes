import { StorageClient } from '@shared/services/storage'
import type { IStorageProvider } from '@shared/services/storage'

export class MemoryStorageProvider implements IStorageProvider {
  private readonly values = new Map<string, string>()

  read(key: string): string | null {
    return this.values.get(key) ?? null
  }

  write(key: string, value: string): void {
    this.values.set(key, value)
  }

  remove(key: string): void {
    this.values.delete(key)
  }
}

export const createMemoryStorage = (): StorageClient => new StorageClient(new MemoryStorageProvider())

export const createDraftStorage = () => ({
  tabStorageClient: createMemoryStorage(),
  deviceStorageClient: createMemoryStorage()
})
