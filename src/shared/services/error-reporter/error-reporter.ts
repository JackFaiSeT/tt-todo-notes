import { isRecord } from '@shared/contract/guards'
import { HTTP_STATUS } from '@shared/contract/http'
import { HTTP_ERROR_NAMES } from '@shared/constants/http'
import type { ErrorSink, IErrorReporter } from './types'

const toCauseChain = (error: unknown): Record<string, unknown>[] => {
  const chain: Record<string, unknown>[] = []

  for (let current = error; isRecord(current) && !chain.includes(current); current = current.cause) {
    chain.push(current)
  }

  return chain
}

const isExpectedFailure = (cause: Record<string, unknown>): boolean => {
  const status = cause.statusCode ?? cause.status

  return (
    cause.name === HTTP_ERROR_NAMES.ABORT ||
    (typeof status === 'number' && status > 0 && status < HTTP_STATUS.INTERNAL_SERVER_ERROR)
  )
}

export class ErrorReporter implements IErrorReporter {
  private readonly reported = new WeakSet<object>()

  constructor(private readonly errorSink: ErrorSink) {}

  report(error: unknown, source: string): void {
    const chain = toCauseChain(error)

    if (chain.some((cause) => this.reported.has(cause) || isExpectedFailure(cause))) {
      return
    }

    for (const cause of chain) {
      this.reported.add(cause)
    }

    this.errorSink(source, error)
  }
}
