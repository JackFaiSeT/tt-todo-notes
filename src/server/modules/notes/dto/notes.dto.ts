import { z } from 'zod'
import {
  DRAFT_SCHEMA_VERSION,
  HISTORY_LIMIT,
  ITEM_LIMIT,
  NEW_DRAFT_KEY,
  OPERATION_TYPES,
  TITLE_LIMIT,
  TODO_LIMIT
} from '@shared/contract/notes/constants'
import { hasContent, isOperationText } from '@shared/contract/notes/content'
import type {
  CreateNote,
  Draft,
  HistoryData,
  NoteContent,
  Operation,
  PutDraft,
  Todo,
  UpdateNote
} from '@shared/contract/notes/types'
import { NOTES_VALIDATION_MESSAGES } from '../constants'
import { noteIdSchema, todoIdSchema } from './params.dto'

const nonNegative = z.int().nonnegative()

const version = z.int().positive()

const operationText = (limit: number) =>
  z.string().refine((value) => isOperationText(value, limit), NOTES_VALIDATION_MESSAGES.TEXT)

const title = operationText(TITLE_LIMIT)

const todoText = operationText(TODO_LIMIT)

const todoSchema = z.strictObject({ id: todoIdSchema, text: todoText, done: z.boolean() }) satisfies z.ZodType<Todo>

const contentSchema = z.strictObject({
  title,
  todos: z
    .array(todoSchema)
    .max(ITEM_LIMIT)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
      NOTES_VALIDATION_MESSAGES.DUPLICATE_TODOS
    )
}) satisfies z.ZodType<NoteContent>

const positionedTodo = { todo: todoSchema, index: nonNegative }

const operationSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal(OPERATION_TYPES.TITLE), before: title, after: title }),
  z.strictObject({
    type: z.literal(OPERATION_TYPES.TODO_TEXT),
    todoId: todoIdSchema,
    before: todoText,
    after: todoText
  }),
  z.strictObject({ type: z.literal(OPERATION_TYPES.TODO_TOGGLE), todoId: todoIdSchema, done: z.boolean() }),
  z.strictObject({ type: z.literal(OPERATION_TYPES.TODO_ADD), ...positionedTodo }),
  z.strictObject({ type: z.literal(OPERATION_TYPES.TODO_REMOVE), ...positionedTodo })
]) satisfies z.ZodType<Operation>

const historySchema = z
  .strictObject({
    undo: z.array(operationSchema).max(HISTORY_LIMIT),
    redo: z.array(operationSchema).max(HISTORY_LIMIT)
  })
  .refine((history) => history.undo.length + history.redo.length <= HISTORY_LIMIT) satisfies z.ZodType<HistoryData>

const draftSchema = z
  .strictObject({
    schemaVersion: z.literal(DRAFT_SCHEMA_VERSION),
    noteId: noteIdSchema.refine((id) => id !== NEW_DRAFT_KEY).nullable(),
    baseVersion: version.nullable(),
    content: contentSchema,
    history: historySchema,
    savedAt: nonNegative
  })
  .refine((draft) => (draft.noteId === null) === (draft.baseVersion === null), {
    path: ['baseVersion'],
    message: NOTES_VALIDATION_MESSAGES.DRAFT_VERSION
  }) satisfies z.ZodType<Draft>

const emptyContentError = { path: ['title'], message: NOTES_VALIDATION_MESSAGES.EMPTY_CONTENT }

export const createNoteSchema = contentSchema
  .extend({ fromDeletedNote: z.boolean().optional() })
  .refine(hasContent, emptyContentError) satisfies z.ZodType<CreateNote>

export const updateNoteSchema = contentSchema
  .extend({ baseVersion: version, force: z.boolean().optional(), confirmedVersion: version.optional() })
  .refine(hasContent, emptyContentError) satisfies z.ZodType<UpdateNote>

export const putDraftSchema = z.strictObject({
  draft: draftSchema,
  observedVersion: version.optional()
}) satisfies z.ZodType<PutDraft>
