import { consola } from 'consola'
import type { ErrorSink } from './types'

export const consoleErrorSink: ErrorSink = (source, error) => {
  if (import.meta.dev) {
    consola.error(source, error)
  }
}
