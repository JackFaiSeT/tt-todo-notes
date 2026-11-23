import type { z } from 'zod'
import { validationFailed } from '#server/common/errors/common.errors'
import { BODY_ERROR_FIELD } from '#server/common/errors/messages'

const UNRECOGNIZED_KEYS_CODE = 'unrecognized_keys'

export const parseInput = <T>(schema: z.ZodType<T>, input: unknown): T => {
  const result = schema.safeParse(input)

  if (result.success) {
    return result.data
  }

  const fields = new Map<string, string[]>()

  for (const issue of result.error.issues) {
    const paths = issue.code === UNRECOGNIZED_KEYS_CODE ? issue.keys.map((key) => [...issue.path, key]) : [issue.path]

    for (const path of paths) {
      const key = path.join('.') || BODY_ERROR_FIELD
      const messages = fields.get(key) ?? []

      messages.push(issue.message)
      fields.set(key, messages)
    }
  }

  throw validationFailed(Object.fromEntries(fields))
}
