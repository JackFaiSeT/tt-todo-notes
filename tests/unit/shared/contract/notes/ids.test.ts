import { describe, expect, it } from 'vitest'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { parseDraftKey, parseNoteId, parseTodoId } from '@shared/contract/notes/ids'

describe('Contract/ids', () => {
  it.each([parseNoteId, parseTodoId])(
    'should enforce the identifier length when parsing a persisted key',
    (parseId) => {
      const longestId = 'a'.repeat(128)

      expect(parseId(longestId)).toBe(longestId)
      expect(() => parseId(longestId + 'b')).toThrow(TypeError)
    }
  )

  it('should reject the route key when it contains several values', () => {
    expect(() => parseDraftKey(['one', 'two'])).toThrow(TypeError)
  })

  it.each([
    { value: NEW_DRAFT_KEY, expected: NEW_DRAFT_KEY },
    { value: 'legacy-id', expected: 'legacy-id' }
  ])('should read the draft key $expected when the route value is $value', ({ value, expected }) => {
    expect(parseDraftKey(value)).toBe(expected)
  })
})
