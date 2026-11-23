import { describe, expect, it } from 'vitest'
import { mergePages, toRefreshLimits } from '@notes/utils/page'
import { createSummary } from '../../../../factories/summaries'

describe('Notes/page', () => {
  it('should skip repeated notes and take the next cursor and count when a page is appended', () => {
    const merged = mergePages(
      { items: [createSummary('a'), createSummary('b')], nextCursor: 'first', count: 3 },
      { items: [createSummary('b'), createSummary('c')], nextCursor: null, count: 4 }
    )

    expect(merged.items.map((note) => note.id)).toEqual(['a', 'b', 'c'])
    expect(merged.nextCursor).toBeNull()
    expect(merged.count).toBe(4)
  })

  it.each([
    { depth: 1, limits: [30] },
    { depth: 3, limits: [90] },
    { depth: 4, limits: [100, 20] },
    { depth: 7, limits: [100, 100, 10] }
  ])('should reload $depth pages with $limits when the list refreshes', ({ depth, limits }) => {
    expect(toRefreshLimits(depth)).toEqual(limits)
  })
})
