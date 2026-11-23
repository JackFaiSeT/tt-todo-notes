export type StoredValueParser<TValue> = (value: unknown) => TValue

export interface IStorageProvider {
  read(key: string): string | null
  write(key: string, value: string): void
  remove(key: string): void
}

export interface IStorageClient {
  read<TValue>(key: string, parse: StoredValueParser<TValue>): TValue | null
  write(key: string, value: unknown): void
  remove(key: string): void
}
