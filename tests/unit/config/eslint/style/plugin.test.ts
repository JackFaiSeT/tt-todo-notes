import { describe, expect, it } from 'vitest'
import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { stylePlugin } from '../../../../../config/eslint/style/plugin.mjs'

const STYLE_RULES = [
  'notes-style/declaration-padding',
  'notes-style/multiline-type-literal',
  'notes-style/named-type-argument',
  'notes-style/no-object-method',
  'notes-style/type-member-style'
]

const lines = (...rows: string[]): string => `${rows.join('\n')}\n`

const linter = new Linter({ configType: 'flat' })

const config: Linter.Config[] = [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'notes-style': stylePlugin },
    rules: Object.fromEntries(STYLE_RULES.map((rule) => [rule, 'error']))
  }
]

const ruleIdsOf = (code: string): (string | null)[] =>
  linter.verify(code, config, 'sample.ts').map((message) => message.ruleId)

const fix = (code: string): string => linter.verifyAndFix(code, config, 'sample.ts').output

describe('Config/eslintStyle', () => {
  describe('declarationPadding', () => {
    it('should reject top-level declarations when no blank line separates them', () => {
      expect(ruleIdsOf(lines('export const ONE = 1', 'export const TWO = 2'))).toEqual([
        'notes-style/declaration-padding'
      ])
    })

    it('should reject namespace members when no blank line separates them', () => {
      const code = lines('export namespace NSample {', '  export type One = string', '  export type Two = number', '}')

      expect(ruleIdsOf(code)).toEqual(['notes-style/declaration-padding'])
    })

    it('should allow imports and re-exports when they are grouped together', () => {
      const code = lines(
        "import { one } from './one'",
        "import { two } from './two'",
        '',
        "export { three } from './three'",
        "export { four } from './four'",
        '',
        'export const sum = one + two'
      )

      expect(ruleIdsOf(code)).toEqual([])
    })

    it('should insert a blank line when adjacent declarations are fixed', () => {
      expect(fix(lines('const one = 1', 'const two = 2'))).toBe(lines('const one = 1', '', 'const two = 2'))
    })
  })

  describe('multilineTypeLiteral', () => {
    it('should reject an object type when its members share the line with the brace', () => {
      expect(ruleIdsOf(lines('export type Todo = { id: string; done: boolean }'))).toEqual([
        'notes-style/multiline-type-literal'
      ])
    })

    it('should allow an object type when it is multiline or empty', () => {
      const code = lines('export type Todo = {', '  id: string', '}', '', 'export type Empty = {}')

      expect(ruleIdsOf(code)).toEqual([])
    })

    it('should move members to a new line when a single-line object type is fixed', () => {
      expect(fix(lines('type Todo = { id: string }'))).toBe(lines('type Todo = {', ' id: string }'))
    })
  })

  describe('namedTypeArgument', () => {
    it('should reject an object type when it is passed as a type argument', () => {
      expect(ruleIdsOf(lines('export const rows = useRef<{ id: string }[]>()'))).toEqual([
        'notes-style/named-type-argument'
      ])
    })

    it('should allow a named type when it is passed as a type argument', () => {
      expect(ruleIdsOf(lines('type Row = {', '  id: string', '}', '', 'export const rows = useRef<Row[]>()'))).toEqual(
        []
      )
    })
  })

  describe('noObjectMethod', () => {
    it('should reject a method when it is declared in an object literal', () => {
      expect(ruleIdsOf(lines('export const plugin = { setup() {} }'))).toEqual(['notes-style/no-object-method'])
    })

    it('should allow an arrow property and an accessor when they are declared in an object literal', () => {
      expect(ruleIdsOf(lines('export const plugin = { setup: () => {}, get name() { return "" } }'))).toEqual([])
    })
  })

  describe('typeMemberStyle', () => {
    it('should rewrite a method signature when it is declared in an object type', () => {
      expect(fix(lines('type Row = {', '  focus(id?: string): void', '  getId<T>(): T', '}'))).toBe(
        lines('type Row = {', '  focus: (id?: string) => void', '  getId: <T>() => T', '}')
      )
    })

    it('should keep member delimiters when a single-line object type is rewritten', () => {
      expect(fix(lines('const row = useRef<Handle & { focus(): void; blur(): void }>()'))).toBe(
        lines('const row = useRef<Handle & { focus: () => void; blur: () => void }>()')
      )
    })

    it('should allow method signatures when they belong to a class contract interface', () => {
      expect(ruleIdsOf(lines('export interface IRow {', '  focus(): void', '}'))).toEqual([])
    })
  })
})
