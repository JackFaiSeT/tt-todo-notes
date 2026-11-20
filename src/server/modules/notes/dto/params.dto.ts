import { z } from 'zod'
import { NOTE_PAGE_DEFAULT, NOTE_PAGE_MAX, NOTE_SEARCH_MAX } from '@shared/contract/notes/constants'
import { isOperationText } from '@shared/contract/notes/content'
import { isEntityId, parseDraftKey, parseNoteId, parseTodoId } from '@shared/contract/notes/ids'
import type { DraftKey, NoteId, TodoId } from '@shared/contract/notes/ids'
import type { DraftParams, NoteParams } from '@shared/contract/notes/types'
import { LIST_QUERY_PATTERNS, NOTES_VALIDATION_MESSAGES } from '../constants'
import type { ListNotesQuery } from '../types'
import { decodeCursor } from '../utils/cursor'

const entityId = z.string().refine(isEntityId, NOTES_VALIDATION_MESSAGES.ENTITY_ID)

export const noteIdSchema = entityId.transform(parseNoteId) satisfies z.ZodType<NoteId>

export const todoIdSchema = entityId.transform(parseTodoId) satisfies z.ZodType<TodoId>

const draftKeySchema = entityId.transform(parseDraftKey) satisfies z.ZodType<DraftKey>

export const noteParamsSchema = z.strictObject({ id: noteIdSchema }) satisfies z.ZodType<NoteParams>

export const draftParamsSchema = z.strictObject({ key: draftKeySchema }) satisfies z.ZodType<DraftParams>

export const listQuerySchema = z
  .strictObject({
    limit: z
      .string()
      .regex(LIST_QUERY_PATTERNS.LIMIT)
      .transform(Number)
      .pipe(z.int().max(NOTE_PAGE_MAX))
      .default(NOTE_PAGE_DEFAULT),
    cursor: z
      .string()
      .transform((value, context) => {
        const cursor = decodeCursor(value)

        if (!cursor) {
          context.addIssue({ code: 'custom', message: NOTES_VALIDATION_MESSAGES.CURSOR })

          return z.NEVER
        }

        return cursor
      })
      .optional(),
    q: z
      .string()
      .trim()
      .refine((value) => isOperationText(value, NOTE_SEARCH_MAX), NOTES_VALIDATION_MESSAGES.TEXT)
      .transform((value) => value || undefined)
      .optional()
  })
  .transform(({ q, ...query }) => ({ ...query, search: q })) satisfies z.ZodType<ListNotesQuery>
