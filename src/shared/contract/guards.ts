export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

const valuesOf = <TValue extends string>(dictionary: Record<string, TValue>): TValue[] => Object.values(dictionary)

export const isValueOf = <TValue extends string>(dictionary: Record<string, TValue>, value: unknown): value is TValue =>
  valuesOf(dictionary).some((item) => item === value)
