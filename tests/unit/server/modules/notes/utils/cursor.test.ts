import { describe, expect, it } from 'vitest'
import { decodeCursor, encodeCursor } from '#server/modules/notes/utils/cursor'
import { parseNoteId } from '@shared/contract/notes/ids'

describe('Notes/cursor', () => {
  it('should read back the position when it was encoded', () => {
    const position = { updatedAt: 1795272645539, id: parseNoteId('note_1-a') }

    expect(decodeCursor(encodeCursor(position))).toEqual(position)
  })

  it.each(['garbage', '12.', '.note', '012.note', '99999999999999999.note', '12.note id', '12.' + 'a'.repeat(129)])(
    'should refuse the cursor when it is %s',
    (value) => {
      expect(decodeCursor(value)).toBeNull()
    }
  )
})
