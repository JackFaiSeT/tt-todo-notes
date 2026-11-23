import { describe, expect, it } from 'vitest'
import { OPERATION_TYPES } from '@shared/contract/notes/constants'
import { parseTodoId } from '@shared/contract/notes/ids'
import { toContent } from '@notes/utils/content'
import { applyOperation } from '@notes/utils/operation'
import type { NNotes } from '@notes/domain'
import { start, operations } from '../../../../factories/history'

const toTodo = (id: string): NNotes.Todo => ({ id: parseTodoId(id), text: id, done: false })

const list: NNotes.Content = { title: 'Порядок', todos: ['a', 'b', 'c'].map(toTodo) }

const idsOf = (content: NNotes.Content): string[] => content.todos.map((item) => item.id)

describe('Notes/Operation', () => {
  it.each([
    { name: 'an item is added in the middle', type: OPERATION_TYPES.TODO_ADD, id: 'x', applied: ['a', 'x', 'b', 'c'] },
    { name: 'the middle item is removed', type: OPERATION_TYPES.TODO_REMOVE, id: 'b', applied: ['a', 'c'] }
  ] as const)('should keep the item order when $name and then undone', ({ type, id, applied }) => {
    const operation: NNotes.Operation = { type, todo: toTodo(id), index: 1 }
    const result = applyOperation(list, { operation })

    expect(idsOf(result)).toEqual(applied)
    expect(idsOf(applyOperation(result, { operation, isReversed: true }))).toEqual(['a', 'b', 'c'])
  })

  it.each(operations)('should reverse the change when applying $type', (op) => {
    const original = toContent(start)
    const result = applyOperation(start, { operation: op })

    expect(result).not.toEqual(original)
    expect(applyOperation(result, { operation: op, isReversed: true })).toEqual(original)
    expect(start).toEqual(original)
  })
})
