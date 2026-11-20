import { TRANSACTION_BEHAVIORS } from './constants'
import type { NotesDatabase } from './connection'

export type DatabaseClient = Pick<NotesDatabase, 'select' | 'update' | 'insert' | 'delete'>

export type Transactions<TClient> = {
  read: <T>(operation: (client: TClient) => T) => T
  runImmediate: <T>(operation: (client: TClient) => T) => T
}

export const createTransactions = (database: NotesDatabase): Transactions<DatabaseClient> => ({
  read: (operation) => database.transaction(operation),
  runImmediate: (operation) => database.transaction(operation, { behavior: TRANSACTION_BEHAVIORS.IMMEDIATE })
})
