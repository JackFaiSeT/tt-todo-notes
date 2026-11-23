import { describe, expect, it } from 'vitest'
import { findDomainTypeViolations, isDomainFile } from '../../../../../scripts/checks/lib/domain-types-rules.mjs'
import { toSource } from '../../../../factories/script-source'

const MODEL_FILE = 'src/core/health/domain/index.ts'

const CONTRACTS_FILE = 'src/core/health/domain/data-contracts.ts'

const messagesOf = (file: string, source: string): string[] =>
  findDomainTypeViolations(file, source).map(({ message }) => message)

describe('Scripts/domainTypesRules', () => {
  it('should report a file when its name does not match a domain file role', () => {
    expect(messagesOf('src/core/catalog/domain/filters.ts', 'export type Mode = string')).toEqual([
      'domain/filters.ts is not a type file; domain/ holds only index.ts and data-contracts.ts'
    ])
  })

  it.each([
    { line: "export const HEALTH_PATH = '/health'", expected: 'domain/ holds a variable' },
    { line: 'export function toLabel(): string { return "" }', expected: 'domain/ holds a function' },
    { line: 'export class HealthModel {}', expected: 'domain/ holds a class' },
    { line: 'export enum HealthState { Ok }', expected: 'domain/ holds an enum' },
    { line: 'export default {}', expected: 'domain/ holds a default export' },
    { line: "export { HEALTH_KEY } from '../constants'", expected: 'domain/ re-exports values' },
    { line: "export type { HealthDto } from './data-contracts'", expected: 'declares its namespace instead' },
    { line: "import { HEALTH_STATES } from '@shared/contract'", expected: 'imports values from @shared/contract' },
    { line: 'export type HealthState = string', expected: 'HealthState is declared outside the namespace' }
  ])('should report $expected when the declaration violates the file contract', ({ line, expected }) => {
    const source = toSource(line, 'export namespace NHealth {', '  export type Model = { release: string }', '}')

    expect(messagesOf(MODEL_FILE, source)).toEqual(expect.arrayContaining([expect.stringContaining(expected)]))
  })

  it('should report a namespace member when it produces a runtime value', () => {
    const source = toSource('export namespace NHealth {', "  export const DEFAULT_RELEASE = ''", '}')

    expect(messagesOf(MODEL_FILE, source)).toEqual(['namespace NHealth holds a variable; domain/ holds only types'])
  })

  it('should reject wire types when they leak into the model', () => {
    const source = toSource(
      "import type { HealthReport, Untrusted } from '@shared/contract'",
      "import type { NHealthDataContracts } from './data-contracts'",
      'export namespace NHealth {',
      '  export type Model = Untrusted<HealthReport>',
      '  export type Raw = NHealthDataContracts.GetReportData',
      '}'
    )

    expect(messagesOf(MODEL_FILE, source)).toEqual([
      'the model imports data contracts; the adapter connects them',
      'namespace NHealth uses Untrusted; models hold checked values'
    ])
  })

  it('should select all domain files when scanning domain directories', () => {
    expect(isDomainFile(MODEL_FILE)).toBe(true)
    expect(isDomainFile('src/core/catalog/domain/filters.ts')).toBe(true)
    expect(isDomainFile('src/core/catalog/utils/filters.ts')).toBe(false)
  })

  it.each([
    {
      file: MODEL_FILE,
      source: 'export namespace Health {\n  export type Model = string\n}',
      expected: 'namespace Health is not named N<Domain>'
    },
    {
      file: CONTRACTS_FILE,
      source: 'export namespace NHealth {\n  export type Data = string\n}',
      expected: 'namespace NHealth is not named N<Domain>DataContracts'
    },
    {
      file: MODEL_FILE,
      source: "import type { HealthState } from '@shared/contract'",
      expected: 'declares 0 namespaces; expected one N<Domain>'
    },
    {
      file: MODEL_FILE,
      source: 'namespace NHealth {\n  export type Model = string\n}',
      expected: 'namespace NHealth is not exported'
    }
  ])('should require $expected when checking the exported namespace for a file role', ({ file, source, expected }) => {
    expect(messagesOf(file, source)).toEqual([expected])
  })

  it('should accept type declarations when the namespace contains no runtime data', () => {
    const source = toSource(
      "import type { HealthState } from '@shared/contract'",
      "import { type PictureData } from '@base'",
      '',
      'export namespace NHealth {',
      '  export type State = HealthState',
      '  export type Model = { state: NHealth.State; picture: PictureData | null }',
      '  export interface Checks { database: NHealth.State }',
      '  export namespace Form {',
      '    export type Values = { release: string }',
      '  }',
      '}'
    )

    expect(messagesOf(MODEL_FILE, source)).toEqual([])
  })
})
