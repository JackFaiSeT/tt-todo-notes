import { z } from 'zod'
import { ERROR_CATEGORIES, ERROR_CODES } from '@shared/contract/http'
import type { ErrorEnvelope } from '@shared/contract/http'
import { parseNoteId, parseTodoId } from '@shared/contract/notes/ids'
import type { Note } from '@shared/contract/notes/types'

export const errorEnvelopeSchema = z.strictObject({
  code: z.enum(ERROR_CODES),
  category: z.enum(ERROR_CATEGORIES),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string().min(1)
}) satisfies z.ZodType<ErrorEnvelope>

export const noteSchema = z.strictObject({
  id: z.string().transform(parseNoteId),
  title: z.string(),
  todos: z.array(z.strictObject({ id: z.string().transform(parseTodoId), text: z.string(), done: z.boolean() })),
  createdAt: z.int().nonnegative(),
  updatedAt: z.int().nonnegative(),
  version: z.int().positive()
}) satisfies z.ZodType<Note>
