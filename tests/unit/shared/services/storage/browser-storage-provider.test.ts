import { describe, expect, it } from 'vitest'
import { BrowserStorageProvider } from '@shared/services/storage'

const createStorage = ({ isFull = false } = {}): Storage => {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key)
    },
    setItem: (key: string, value: string) => {
      if (isFull) {
        throw new DOMException('quota', 'QuotaExceededError')
      }

      values.set(key, value)
    }
  }
}

describe('Shared/BrowserStorageProvider', () => {
  it('should drop the previous value when the browser refuses a write', () => {
    const storage = createStorage()
    const provider = new BrowserStorageProvider(() => storage)

    provider.write('draft', 'старый')

    new BrowserStorageProvider(() => ({ ...storage, setItem: createStorage({ isFull: true }).setItem })).write(
      'draft',
      'новый'
    )

    expect(provider.read('draft')).toBeNull()
  })

  it('should read nothing when the browser blocks storage access', () => {
    const blocked = {
      ...createStorage(),
      getItem: () => {
        throw new DOMException('denied', 'SecurityError')
      }
    }

    expect(new BrowserStorageProvider(() => blocked).read('draft')).toBeNull()
  })

  it('should keep working without storage when the browser refuses to expose it', () => {
    const provider = new BrowserStorageProvider(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    provider.write('draft', 'текст')
    provider.remove('draft')
    expect(provider.read('draft')).toBeNull()
  })
})
