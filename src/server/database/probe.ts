import { databaseUnavailable } from '#server/common/errors/common.errors'
import { MIGRATION_STATEMENTS } from './constants'
import type { NotesDatabase } from './connection'

export type DatabaseProbe = () => void

export const createDatabaseProbe = (database: NotesDatabase): DatabaseProbe => {
  const probe = database.$client.prepare(MIGRATION_STATEMENTS.PROBE)

  return () => {
    try {
      probe.get()
    } catch (cause) {
      throw databaseUnavailable(cause)
    }
  }
}
