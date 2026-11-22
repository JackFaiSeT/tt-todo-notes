import { describe, expect, it } from 'vitest'
import { migratePayload } from '#server/modules/notes/utils/migrate-payload'
import { DRAFT_SCHEMA_VERSION } from '@shared/contract/notes/constants'

describe('Notes/MigratePayload', () => {
  it('should reject an older version when its migration is missing', () => {
    expect(() => migratePayload({ schemaVersion: 0 })).toThrow('Неизвестная версия черновика')
  })

  it('should reject a future version when reading a newer draft', () => {
    expect(() => migratePayload({ schemaVersion: DRAFT_SCHEMA_VERSION + 1 })).toThrow('Неизвестная версия черновика')
  })

  it('should refuse a migration step when it does not produce the next version', () => {
    const registry = new Map<number, (data: Record<string, unknown>) => Record<string, unknown>>([
      [0, () => ({ schemaVersion: 2 })]
    ])

    expect(() => migratePayload({ schemaVersion: 0 }, 2, registry)).toThrow('Некорректная миграция')
  })

  it('should pass the migrated content to each step when upgrading an older payload', () => {
    const registry = new Map<number, (data: Record<string, unknown>) => Record<string, unknown>>([
      [0, (data) => ({ schemaVersion: 1, title: data.caption })],
      [1, (data) => ({ schemaVersion: 2, content: { title: data.title } })]
    ])

    expect(migratePayload({ schemaVersion: 0, caption: 'План' }, 2, registry)).toEqual({
      schemaVersion: 2,
      content: { title: 'План' }
    })
  })
})
