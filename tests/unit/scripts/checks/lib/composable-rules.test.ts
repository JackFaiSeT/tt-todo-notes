import { describe, expect, it } from 'vitest'
import {
  checkSingleComposable,
  checkValueExports,
  findComposableViolations,
  isComposableFile
} from '../../../../../scripts/checks/lib/composable-rules.mjs'
import { toEntry, toSource } from '../../../../factories/script-source'

const VIEW_COMPOSABLE = 'src/core/user/components/views/profile/composables/useProfileView.ts'

describe('Scripts/composableRules', () => {
  describe('isComposableFile', () => {
    it.each([
      { file: 'src/core/user/composables/index.ts' },
      { file: 'src/core/user/utils/useLike.ts' },
      { file: 'src/core/user/composables/profile.ts' }
    ])('should return false when $file is not a use-file in composables', ({ file }) => {
      expect(isComposableFile(file)).toBe(false)
    })

    it.each([{ file: VIEW_COMPOSABLE }, { file: 'src/core/user/composables/api/useProfile.ts' }])(
      'should return true when $file is a composable',
      ({ file }) => {
        expect(isComposableFile(file)).toBe(true)
      }
    )
  })

  describe('checkSingleComposable', () => {
    it.each([
      { source: 'export const useOther = () => 1', label: 'the composable is named differently' },
      {
        source: toSource('export const useProfileView = () => 1', 'export const useExtra = () => 2'),
        label: 'the file exports two composables'
      },
      { source: 'const useProfileView = () => 1', label: 'the composable is not exported' }
    ])('should report the file when $label', ({ source }) => {
      expect(checkSingleComposable(toEntry(source, VIEW_COMPOSABLE))).toHaveLength(1)
    })

    it.each([
      { source: 'export const useProfileView = () => 1', label: 'an arrow function' },
      { source: 'export async function useProfileView() {}', label: 'an async function' }
    ])('should allow one composable named after the file when it is $label', ({ source }) => {
      expect(checkSingleComposable(toEntry(source, VIEW_COMPOSABLE))).toEqual([])
    })
  })

  describe('checkValueExports', () => {
    it.each([
      { source: 'export const PROFILE_LIMIT = 3', extra: 'PROFILE_LIMIT' },
      { source: 'export function toLabel() {}', extra: 'toLabel' },
      { source: 'export default {}', extra: 'default' },
      { source: 'export { toLabel as formatLabel }', extra: 'formatLabel' }
    ])('should report $extra when a composable exports another runtime value', ({ source, extra }) => {
      const entry = toEntry(toSource('export const useProfileView = () => 1', source), VIEW_COMPOSABLE)

      expect(checkValueExports(entry)).toEqual([expect.stringContaining(`[${extra}]`)])
    })

    it.each([
      { source: 'export const provideProfileView = () => 1', label: 'the provide pair' },
      { source: 'export type ProfileView = { name: string }', label: 'a type' },
      { source: 'export { type ProfileView }', label: 'a listed type' }
    ])('should allow the companion export when it is $label', ({ source }) => {
      const entry = toEntry(toSource('export const useProfileView = () => 1', source), VIEW_COMPOSABLE)

      expect(checkValueExports(entry)).toEqual([])
    })
  })

  describe('findComposableViolations', () => {
    it('should collect the violations of every rule when the file breaks several of them', () => {
      const entry = toEntry(
        toSource('export const useOther = () => useUserService()', 'export const LIMIT = 1'),
        'src/core/user/composables/useProfileState.ts'
      )

      expect(findComposableViolations(entry)).toHaveLength(2)
    })
  })
})
