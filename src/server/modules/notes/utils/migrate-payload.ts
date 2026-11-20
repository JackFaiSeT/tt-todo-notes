import { isNonNegativeInteger, isRecord } from '@shared/contract/guards'
import { DRAFT_SCHEMA_VERSION } from '@shared/contract/notes/constants'
import { DRAFT_MIGRATION_ERRORS } from '../constants'

type Migration = (data: Record<string, unknown>) => unknown

const migrations = new Map<number, Migration>()

export const migratePayload = (
  raw: unknown,
  target: number = DRAFT_SCHEMA_VERSION,
  registry: ReadonlyMap<number, Migration> = migrations
): unknown => {
  let data = raw

  while (isRecord(data) && isNonNegativeInteger(data.schemaVersion) && data.schemaVersion < target) {
    const next = registry.get(data.schemaVersion)

    if (!next) {
      break
    }

    const version = data.schemaVersion + 1

    data = next(data)

    if (!isRecord(data) || data.schemaVersion !== version) {
      throw new Error(DRAFT_MIGRATION_ERRORS.INVALID_STEP)
    }
  }

  if (!isRecord(data) || data.schemaVersion !== target) {
    throw new Error(DRAFT_MIGRATION_ERRORS.UNKNOWN_VERSION)
  }

  return data
}
