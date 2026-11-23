import { describe, expect, it } from 'vitest'
import { NOTE_SEARCH_MAX } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import { toNeighborIds, toSearchText } from '@notes/components/views/notes-list-view/utils'
import { createSummary } from '../../../../../../../factories/summaries'

const notes = ['a', 'b', 'c'].map((id) => createSummary(id))

describe('Notes/notesListUtils', () => {
  it.each([
    { id: 'a', expected: ['b'] },
    { id: 'b', expected: ['c', 'a'] },
    { id: 'c', expected: ['b'] }
  ])('should prefer the next note over the previous one when $id is removed', ({ id, expected }) => {
    expect(toNeighborIds(notes, parseNoteId(id))).toEqual(expected)
  })

  it.each([
    { value: '  кухня ', expected: 'кухня' },
    { value: 'кухня\tремонт\u0007', expected: 'кухня ремонт' },
    { value: ['первый', 'второй'], expected: 'первый' },
    { value: undefined, expected: '' },
    { value: null, expected: '' },
    { value: 'я'.repeat(NOTE_SEARCH_MAX + 5), expected: 'я'.repeat(NOTE_SEARCH_MAX) }
  ])('should read the search text $expected when the query value is $value', ({ value, expected }) => {
    expect(toSearchText(value)).toBe(expected)
  })

  it('should offer no neighbour when the only note is removed', () => {
    expect(toNeighborIds([createSummary('a')], parseNoteId('a'))).toEqual([])
  })
})
