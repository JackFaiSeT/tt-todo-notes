import { describe, expect, it } from 'vitest'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import type { DraftKey } from '@shared/contract/notes/ids'
import { toNotePath } from '@notes/utils/route'

const cases: { key: DraftKey; path: string }[] = [
  { key: NEW_DRAFT_KEY, path: '/notes/new' },
  { key: parseNoteId('legacy-id'), path: '/notes/legacy-id' }
]

describe('Notes/Route', () => {
  it.each(cases)('should build $path when the editor key is $key', ({ key, path }) => {
    expect(toNotePath(key)).toBe(path)
  })
})
