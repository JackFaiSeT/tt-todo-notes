import { describe, expect, it } from 'vitest'
import { CHANGE_TYPES } from '@notes/constants'
import { parseChange } from '@notes/utils/change'

describe('Notes/parseChange', () => {
  it.each([CHANGE_TYPES.SAVED, CHANGE_TYPES.DELETED])('should read a %s change when another tab sends it', (type) => {
    expect(parseChange({ type, id: 'note-1' })).toEqual({ type, id: 'note-1' })
  })

  it.each([
    { name: 'a string', value: 'saved' },
    { name: 'null', value: null },
    { name: 'an array', value: [CHANGE_TYPES.SAVED, 'note-1'] },
    { name: 'no id', value: { type: CHANGE_TYPES.SAVED } },
    { name: 'an id with spaces', value: { type: CHANGE_TYPES.SAVED, id: 'note 1' } },
    { name: 'a numeric id', value: { type: CHANGE_TYPES.SAVED, id: 1 } },
    { name: 'an unknown type', value: { type: 'renamed', id: 'note-1' } }
  ])('should ignore the message when it is $name', ({ value }) => {
    expect(parseChange(value)).toBeNull()
  })
})
