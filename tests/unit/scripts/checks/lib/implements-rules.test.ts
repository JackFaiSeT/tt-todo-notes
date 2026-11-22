import { describe, expect, it } from 'vitest'
import { findImplementsViolations } from '../../../../../scripts/checks/lib/implements-rules.mjs'
import { toEntry, toSource } from '../../../../factories/script-source'

describe('Scripts/implementsRules', () => {
  describe('findImplementsViolations', () => {
    it.each([
      { source: 'export class UserService {', name: 'UserService' },
      { source: 'class Cache<TValue> {', name: 'Cache' },
      { source: 'export class AdminService extends UserService {', name: 'AdminService' }
    ])('should report $name when it implements no interface', ({ source, name }) => {
      expect(findImplementsViolations(toEntry(source))).toEqual([{ file: 'src/shared/utils/sample.ts', line: 1, name }])
    })

    it('should report the declaration line when a class lacks an interface', () => {
      const source = toSource('class First {}', '', 'class Second implements ISecond {}', 'class Third {}')

      expect(findImplementsViolations(toEntry(source)).map((violation: { line: unknown }) => violation.line)).toEqual([
        1, 4
      ])
    })

    it.each([
      { source: 'export class UserService implements IUserService {', label: 'a class with implements' },
      { source: 'class Store<T> implements IStore<T> {', label: 'a generic class with implements' },
      { source: 'export class AuthError extends Error {', label: 'an Error subclass' },
      { source: 'class TokenError extends AuthError {', label: 'a subclass of a domain error' },
      { source: "const label = 'class Sample {'", label: 'a class keyword inside a string' }
    ])('should allow the source when it uses $label', ({ source }) => {
      expect(findImplementsViolations(toEntry(source))).toEqual([])
    })
  })
})
