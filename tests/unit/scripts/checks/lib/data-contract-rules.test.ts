import { describe, expect, it } from 'vitest'
import {
  findAdapterViolations,
  findDataContractViolations,
  isAdapterFile
} from '../../../../../scripts/checks/lib/data-contract-rules.mjs'
import { toSource } from '../../../../factories/script-source'

const CONTRACTS_FILE = 'src/core/health/domain/data-contracts.ts'

const ADAPTER_FILE = 'src/core/health/adapter.ts'

const SHARED_IMPORT = "import type { HealthReport, HealthQuery, Untrusted } from '@shared/contract'"

const inNamespace = (...members: string[]): string =>
  toSource(SHARED_IMPORT, '', 'export namespace NHealthDataContracts {', ...members.map((line) => `  ${line}`), '}')

describe('Scripts/dataContractRules', () => {
  describe('findDataContractViolations', () => {
    it.each([
      {
        source: inNamespace('export interface GetReportData {', '  status: string', '}'),
        expected: 'interface GetReportData copies the contract'
      },
      {
        source: inNamespace("export type GetReportData = Untrusted<{ status: 'ok' | 'fail' }>"),
        expected: 'GetReportData describes the shape locally'
      },
      {
        source: toSource(
          "import type { Report } from '../types'",
          'export namespace NHealthDataContracts {',
          '  export type GetReportData = Report',
          '}'
        ),
        expected: 'imports ../types; data contracts take types only from @shared/contract'
      },
      {
        source: inNamespace('export type GetReportData = Untrusted<Local<HealthReport>>'),
        expected: 'GetReportData refers to Local, which is not imported from @shared/contract'
      },
      {
        source: inNamespace('export type GetReportData = HealthReport'),
        expected: 'GetReportData is a response; wrap the type of @shared/contract into Untrusted'
      },
      {
        source: inNamespace('export type GetReportRequestParams = Untrusted<HealthQuery>'),
        expected: 'GetReportRequestParams is a request the frontend builds'
      },
      {
        source: inNamespace('export type ReportState = string'),
        expected: 'ReportState does not refer to a type of @shared/contract'
      }
    ])('should report $expected when the declaration violates the file contract', ({ source, expected }) => {
      expect(findDataContractViolations(CONTRACTS_FILE, source)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ file: CONTRACTS_FILE, message: expect.stringContaining(expected) })
        ])
      )
    })

    it('should accept wire types when responses are untrusted and requests are exact', () => {
      const source = inNamespace(
        'export type GetReportData = Untrusted<HealthReport>',
        'export type GetReportListData = Untrusted<readonly HealthReport[]>',
        'export type GetReportItemData = NHealthDataContracts.GetReportData',
        'export type GetReportRequestParams = HealthQuery',
        'export type PostReportRequestBody = Pick<HealthReport, "release">'
      )

      expect(findDataContractViolations(CONTRACTS_FILE, source)).toEqual([])
    })
  })

  describe('findAdapterViolations', () => {
    it('should report a response type when declared locally in an adapter', () => {
      const source = toSource('interface ReportResponse {', '  status: string', '}', 'export class HealthAdapter {}')

      expect(findAdapterViolations(ADAPTER_FILE, source)).toEqual([
        expect.objectContaining({
          line: 1,
          message: expect.stringContaining('ReportResponse is declared in the adapter')
        })
      ])
    })

    it('should report a cast when a response is asserted to be a model', () => {
      const source = toSource(
        'export class HealthAdapter {',
        '  public toModel(dto: Dto): NHealth.Model {',
        '    return dto as NHealth.Model',
        '  }',
        '}'
      )

      expect(findAdapterViolations(ADAPTER_FILE, source)).toEqual([
        expect.objectContaining({ line: 3, message: expect.stringContaining('casts with "NHealth.Model"') })
      ])
    })

    it('should select adapter files when matching a domain adapter and its siblings', () => {
      expect(isAdapterFile(ADAPTER_FILE)).toBe(true)
      expect(isAdapterFile('src/core/news/widget-adapter.ts')).toBe(true)
      expect(isAdapterFile('src/core/news/utils/adapter.ts')).toBe(false)
    })

    it('should allow typed adapters when contract literals use const assertions', () => {
      const source = toSource(
        "import type { NHealth } from './domain'",
        "import type { NHealthDataContracts } from './domain/data-contracts'",
        'export interface IHealthAdapter {',
        '  toModel(dto: NHealthDataContracts.GetReportData): NHealth.Model',
        '}',
        "const STATES = ['ok'] as const"
      )

      expect(findAdapterViolations(ADAPTER_FILE, source)).toEqual([])
    })
  })
})
