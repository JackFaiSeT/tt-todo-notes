import type { IStorageClient, IStorageProvider, StoredValueParser } from './types'

export class StorageClient implements IStorageClient {
  constructor(private readonly storageProvider: IStorageProvider) {}

  read<TValue>(key: string, parse: StoredValueParser<TValue>): TValue | null {
    const stored = this.storageProvider.read(key)

    if (stored === null) {
      return null
    }

    try {
      return parse(JSON.parse(stored))
    } catch {
      this.storageProvider.remove(key)

      return null
    }
  }

  write(key: string, value: unknown): void {
    this.storageProvider.write(key, JSON.stringify(value))
  }

  remove(key: string): void {
    this.storageProvider.remove(key)
  }
}
