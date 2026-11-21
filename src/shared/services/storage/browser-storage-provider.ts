import type { IStorageProvider } from './types'

const attempt = <TResult>(action: () => TResult, fallback: TResult): TResult => {
  try {
    return action()
  } catch {
    return fallback
  }
}

export class BrowserStorageProvider implements IStorageProvider {
  constructor(private readonly resolveStorage: () => Storage) {}

  read(key: string): string | null {
    return attempt(() => this.resolveStorage().getItem(key), null)
  }

  write(key: string, value: string): void {
    const isWritten = attempt(() => {
      this.resolveStorage().setItem(key, value)

      return true
    }, false)

    if (!isWritten) {
      this.remove(key)
    }
  }

  remove(key: string): void {
    attempt(() => this.resolveStorage().removeItem(key), undefined)
  }
}
