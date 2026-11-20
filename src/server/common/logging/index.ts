import { pino } from 'pino'
import type { DestinationStream, Logger } from 'pino'
import { currentRequestId } from '#server/common/request-context'
import { errorCauses } from '#server/common/errors/causes'
import {
  ERROR_CODE_PATTERN,
  LOG_PLACEHOLDERS,
  SENSITIVE_FIELD_PATTERN,
  SENSITIVE_FIELDS,
  STACK_FRAME_PREFIX
} from './constants'

export type DiagnosticFields = {
  errorType?: string
  errorCode?: string
  stack?: string | undefined
}

const toStackFrames = (stack: string | undefined): string | undefined =>
  stack
    ?.split('\n')
    .filter((line) => line.startsWith(STACK_FRAME_PREFIX))
    .join('\n')

export const diagnosticFields = (cause: unknown): DiagnosticFields => {
  const error = errorCauses(cause).at(-1)

  if (!error) {
    return {}
  }

  const code = 'code' in error ? error.code : undefined

  return {
    errorType: error.name,
    ...(typeof code === 'string' && ERROR_CODE_PATTERN.test(code) && { errorCode: code }),
    stack: toStackFrames(error.stack)
  }
}

const isSensitive = (key: string): boolean =>
  SENSITIVE_FIELDS.has(key.toLowerCase()) || SENSITIVE_FIELD_PATTERN.test(key)

const redactValue = (key: string, value: unknown, ancestors: Set<object>): unknown => {
  if (isSensitive(key)) {
    return LOG_PLACEHOLDERS.REDACTED
  }

  if (value instanceof Error) {
    return diagnosticFields(value)
  }

  if (value === null || typeof value !== 'object' || value instanceof Date) {
    return value
  }

  if (ancestors.has(value)) {
    return LOG_PLACEHOLDERS.CIRCULAR
  }

  ancestors.add(value)

  const redacted = Array.isArray(value)
    ? value.map((item) => redactValue('', item, ancestors))
    : redactFields(value, ancestors)

  ancestors.delete(value)

  return redacted
}

const redactFields = (fields: object, ancestors = new Set<object>()): Record<string, unknown> =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, redactValue(key, value, ancestors)]))

export const createLogger = (destination: DestinationStream = process.stdout): Logger =>
  pino(
    {
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { level: (level) => ({ level }), log: redactFields },
      mixin: () => ({ requestId: currentRequestId() })
    },
    destination
  )
