import { describe, expect, it } from 'vitest'
import { findTestLayoutViolations, TEST_LAYOUT_REASON } from '../../../../../scripts/checks/lib/test-layout-rules.mjs'

type LayoutViolation = {
  reason: string
}

const SOURCES = [
  'src/core/notes/adapter.ts',
  'src/shared/uikit/components/ui-tabs/index.vue',
  'src/app/pages/(home)/index.vue',
  'src/app/pages/products/[brandSlug]/[skuSlug].vue',
  'src/app/pages/_kit/components/kit-board/index.vue',
  'src/app/layouts/default/index.vue',
  'src/app/error.vue',
  'nuxt.config.ts',
  'config/aliases.mts',
  'scripts/checks/lib/comment-rules.mjs',
  'src/shared/contract/note.ts',
  'src/server/database/service.ts'
]

const reasonsOf = (...tests: string[]): string[] =>
  findTestLayoutViolations([...SOURCES, ...tests]).map(({ reason }: LayoutViolation) => reason)

describe('Scripts/testLayoutRules', () => {
  describe('location', () => {
    it.each([
      'src/core/notes/adapter.test.ts',
      'scripts/checks/lib/comment-rules.test.mjs',
      'scripts/checks/tests/comment-rules.test.ts'
    ])('should reject %s when it is outside tests/', (path) => {
      expect(reasonsOf(path)).toEqual([TEST_LAYOUT_REASON.OUTSIDE_TESTS])
    })

    it('should ignore helpers and fixtures when their names do not identify tests', () => {
      expect(reasonsOf('tests/unit/core/notes/support.ts', 'tests/factories/x.factory.ts')).toEqual([])
    })
  })

  describe('mirror', () => {
    it.each([
      'tests/unit/src/core/notes/adapter.test.ts',
      'tests/helpers/adapter.test.ts',
      'tests/unit/tests/factories/notes.test.ts'
    ])('should reject %s when a test is outside the supported mirrors', (path) => {
      expect(reasonsOf(path)).toEqual([TEST_LAYOUT_REASON.UNKNOWN_SUITE])
    })

    it.each([
      ['tests/integration/server/database/missing.integration.test.ts', 'src/server/database/missing.*'],
      ['tests/unit/contracts/note.test.ts', 'contracts/note.*'],
      ['tests/unit/core/notes/product-card.test.ts', 'src/core/notes/product-card.*'],
      ['tests/unit/shared/note.test.ts', 'src/shared/note.*'],
      ['tests/unit/shared/contract/uikit/components/ui-tabs.test.ts', 'src/shared/contract/uikit/components/ui-tabs.*'],
      ['tests/unit/scripts/checks/lib/missing.test.mjs', 'scripts/checks/lib/missing.*']
    ])('should reject %s when its mirror source is missing', (path, expected) => {
      expect(reasonsOf(path)[0]).toContain(expected)
    })

    it.each([
      'tests/unit/core/notes/adapter.test.ts',
      'tests/unit/shared/uikit/components/ui-tabs/index.test.ts',
      'tests/unit/shared/uikit/components/ui-tabs.test.ts',
      'tests/unit/scripts/checks/lib/comment-rules.test.ts',
      'tests/unit/shared/contract/note.test.ts',
      'tests/integration/server/database/service.integration.test.ts',
      'tests/unit/nuxt.config.test.ts',
      'tests/unit/config/aliases.test.ts',
      'tests/integration/core/notes/adapter.integration.test.ts'
    ])('should accept %s when its path mirrors a source', (path) => {
      expect(reasonsOf(path)).toEqual([])
    })
  })

  describe('e2e', () => {
    it.each([
      ['tests/e2e/catalog/catalog-filters.spec.ts', TEST_LAYOUT_REASON.E2E_DIRECTORY('catalog')],
      ['tests/e2e/_kit/components/kit-board.spec.ts', TEST_LAYOUT_REASON.E2E_DIRECTORY('_kit/components')],
      ['tests/e2e/layouts/landing/header.spec.ts', TEST_LAYOUT_REASON.E2E_DIRECTORY('layouts/landing')],
      ['tests/e2e/header.spec.ts', TEST_LAYOUT_REASON.E2E_ROOT]
    ])('should reject %s when its directory matches no route or check kind', (path, reason) => {
      expect(reasonsOf(path)).toEqual([reason])
    })

    it.each([
      'tests/e2e/(home)/hero.spec.ts',
      'tests/e2e/products/catalog-filters.spec.ts',
      'tests/e2e/products/[brandSlug]/[skuSlug]/gallery.spec.ts',
      'tests/e2e/_kit/modal-transition.spec.ts',
      'tests/e2e/layouts/default/header.spec.ts',
      'tests/e2e/error/server-error.spec.ts',
      'tests/e2e/flows/feedback/reply.spec.ts'
    ])('should accept %s when the directory matches a route, layout or check kind', (path) => {
      expect(reasonsOf(path)).toEqual([])
    })
  })
})
