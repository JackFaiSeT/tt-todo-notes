import { describe, expect, it } from 'vitest'
import {
  expectedDependencyNames,
  findDependencyNameViolations,
  MAX_CONSTRUCTOR_DEPENDENCIES
} from '../../../../../scripts/checks/lib/dependency-names-rules.mjs'
import { toSource } from '../../../../factories/script-source'

const FILE = 'apps/api/src/modules/news/services/news.service.ts'

const classWith = (...parameters: string[]): string =>
  toSource('export class NewsService {', '  constructor(', ...parameters.map((line) => `    ${line},`), '  ) {}', '}')

const findIn = (source: string, limits: Readonly<Record<string, number>> = {}) =>
  findDependencyNameViolations({ file: FILE, source, limits })

describe('Scripts/dependencyNamesRules', () => {
  describe('findDependencyNameViolations', () => {
    it.each([
      ['a short name', 'private readonly repo: NewsRepository', 'repo', 'newsRepository'],
      ['a name without the role', 'private readonly news: NewsService', 'news', 'newsService'],
      ['an I prefix of the interface', 'private readonly iHttpClient: IHttpClient', 'iHttpClient', 'httpClient'],
      ['a generic type', 'private readonly config: ConfigService<Env, true>', 'config', 'configService'],
      ['a token with another name', '@Inject(PG_BOSS) private readonly boss: PgBoss', 'boss', 'pgBoss']
    ])('should report the dependency name when %s', (_condition, parameter, name, expected) => {
      expect(findIn(classWith(parameter))).toEqual([
        { file: FILE, line: 3, className: 'NewsService', kind: 'name', name, expected: [expected] }
      ])
    })

    it('should report a constructor when its dependency count exceeds the limit', () => {
      const parameters = Array.from(
        { length: MAX_CONSTRUCTOR_DEPENDENCIES + 1 },
        (_value, index) => `private readonly part${index}Service: Part${index}Service`
      )

      expect(findIn(classWith(...parameters))).toEqual([
        { file: FILE, line: 1, className: 'NewsService', kind: 'limit', count: MAX_CONSTRUCTOR_DEPENDENCIES + 1 }
      ])
    })

    it.each([
      ['a type in camelCase', 'private readonly newsRepository: NewsRepository'],
      ['an interface without the I prefix', 'private readonly httpClient: IHttpClient'],
      ['a generic type', 'private readonly configService: ConfigService<Env, true>'],
      ['a name of the injection token', '@Inject(ERROR_TRACKER) private readonly errorTracker: Tracker'],
      ['a primitive value', '@Inject(APP_RELEASE) private readonly release: string'],
      ['a value type named by its role', 'private readonly mediaId: MediaFileId']
    ])('should accept the dependency name when %s', (_condition, parameter) => {
      expect(findIn(classWith(parameter))).toEqual([])
    })

    it('should allow data properties when the class extends Error', () => {
      const source = toSource(
        'export class HttpError extends Error {',
        '  constructor(private readonly details: HttpErrorDetails) {',
        '    super(details.message)',
        '  }',
        '}'
      )

      expect(findIn(source)).toEqual([])
    })

    it('should accept role names when two dependencies have the same type', () => {
      expect(
        findIn(classWith('private readonly s3Client: S3Client', 'private readonly signingClient: S3Client'))
      ).toEqual([])
    })

    it('should accept an exception when the listed class has exactly its declared dependency count', () => {
      const parameters = Array.from(
        { length: MAX_CONSTRUCTOR_DEPENDENCIES + 2 },
        (_value, index) => `private readonly part${index}Service: Part${index}Service`
      )

      expect(findIn(classWith(...parameters), { NewsService: MAX_CONSTRUCTOR_DEPENDENCIES + 2 })).toEqual([])

      expect(findIn(classWith(...parameters), { NewsService: MAX_CONSTRUCTOR_DEPENDENCIES + 3 })).toEqual([
        { file: FILE, line: 1, className: 'NewsService', kind: 'limit', count: MAX_CONSTRUCTOR_DEPENDENCIES + 2 }
      ])
    })
  })

  describe('expectedDependencyNames', () => {
    it('should derive dependency names when a type or injection token identifies the port', () => {
      expect(expectedDependencyNames('IHealthApi', 'HEALTH_API')).toEqual(['healthApi'])
      expect(expectedDependencyNames('PgBoss', 'PG_BOSS')).toEqual(['pgBoss'])
      expect(expectedDependencyNames('Queue', 'BILLING_QUEUE')).toEqual(['queue', 'billingQueue'])
      expect(expectedDependencyNames('$Fetch')).toEqual(['fetch'])
      expect(expectedDependencyNames('S3Client')).toEqual(['s3Client'])
    })
  })
})
