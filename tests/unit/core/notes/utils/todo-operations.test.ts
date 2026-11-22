import { describe, expect, it } from 'vitest'
import { OPERATION_TYPES } from '@shared/contract/notes/constants'
import { parseTodoId } from '@shared/contract/notes/ids'
import { toAddOperation, toRemoveOperation, toToggleOperation } from '@notes/utils/todo-operations'
import { start, todo } from '../../../../factories/history'

const added = parseTodoId('added')

describe('Notes/todoOperations', () => {
  it('should append an empty item when no anchor row is given', () => {
    expect(toAddOperation(start, { id: added })).toEqual({
      type: OPERATION_TYPES.TODO_ADD,
      todo: { id: added, text: '', done: false },
      index: 1
    })
  })

  it('should insert right after the anchor row when one is given', () => {
    const content = { ...start, todos: [todo, { ...todo, id: parseTodoId('second') }] }

    expect(toAddOperation(content, { id: added, after: todo.id }).index).toBe(1)
  })

  it('should keep the removed item and its position when a row is deleted', () => {
    expect(toRemoveOperation(start, todo.id)).toEqual({ type: OPERATION_TYPES.TODO_REMOVE, todo, index: 0 })
  })

  it('should invert the completion flag when a row is toggled', () => {
    expect(toToggleOperation(start, todo.id)).toEqual({
      type: OPERATION_TYPES.TODO_TOGGLE,
      todoId: todo.id,
      done: true
    })
  })

  it('should produce no operation when the row is unknown', () => {
    expect(toRemoveOperation(start, added)).toBeNull()
    expect(toToggleOperation(start, added)).toBeNull()
  })
})
