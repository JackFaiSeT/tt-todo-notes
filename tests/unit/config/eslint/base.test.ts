import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { ESLint } from 'eslint'
import { virtualSourceConfig } from '../../../factories/eslint'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))

const lines = (...rows: string[]): string => `${rows.join('\n')}\n`

let eslint: ESLint

let virtualEslint: ESLint

const lintMessages = async (code: string, filePath: string): Promise<ESLint.LintResult['messages']> => {
  const [result] = await (existsSync(filePath) ? eslint : virtualEslint).lintText(code, { filePath })

  return result?.messages ?? []
}

const ruleIdsOf = async (code: string, filePath: string): Promise<(string | null)[]> =>
  (await lintMessages(code, filePath)).map((message) => message.ruleId)

describe('Config/eslint', () => {
  beforeAll(async () => {
    eslint = new ESLint({ cwd: ROOT })

    virtualEslint = new ESLint({ cwd: ROOT, overrideConfig: virtualSourceConfig })

    await eslint.calculateConfigForFile('src/shared/utils/sample.ts')
    await lintMessages('', 'src/core/notes/service.ts')
    await lintMessages('', 'src/shared/utils/sample.ts')
  }, 60_000)

  it.each(['window.localStorage.getItem("x")', 'window.fetch("/")'])(
    'should reject %s when browser globals bypass the client services',
    async (source) => {
      expect(await ruleIdsOf(source, 'src/core/notes/service.ts')).toContain('no-restricted-globals')
    }
  )

  it('should reject $fetch when called outside the HTTP client', async () => {
    const code = lines(
      '<script setup lang="ts">',
      "const news = await $fetch('/api/notes')",
      '</script>',
      '',
      '<template>',
      '  <p>{{ news }}</p>',
      '</template>'
    )

    const messages = await lintMessages(code, 'src/core/notes/components/views/news-list/index.vue')

    expect(messages.map((message) => message.ruleId)).toEqual(['no-restricted-globals'])
    expect(messages[0]?.message).toContain('@shared/services/http')
  })

  it('should reject useFetch when imported outside the HTTP client', async () => {
    const code = lines(
      "import { useFetch } from '#imports'",
      '',
      "export const load = (): unknown => useFetch('/api/notes')"
    )

    expect(await ruleIdsOf(code, 'src/core/notes/composables/use-news.ts')).toEqual(['no-restricted-imports'])
  })

  it('should reject a literal store id when a store is defined with Pinia', async () => {
    const code = lines(
      "import { defineStore } from 'pinia'",
      '',
      "export const useMenuStore = defineStore('menu', () => ({}))"
    )

    expect(await ruleIdsOf(code, 'src/shared/stores/useMenuStore.ts')).toEqual(['no-restricted-syntax'])
  })

  it('should allow $fetch when it is used in the HTTP client', async () => {
    const code = lines('export const request = (url: string): Promise<unknown> => $fetch(url)')

    expect(await ruleIdsOf(code, 'src/shared/services/http/client.ts')).toEqual([])
  })

  it('should allow a type namespace when the source is a domain type file', async () => {
    const code = lines('export namespace NHealth {', '  export type Model = {', '    release: string', '  }', '}')

    expect(await ruleIdsOf(code, 'src/core/health/domain/index.ts')).toEqual([])
    expect(await ruleIdsOf(code, 'src/core/users/domain/data-contracts.ts')).toEqual([])

    expect(await ruleIdsOf(code, 'src/core/health/utils/report.ts')).toEqual(['@typescript-eslint/no-namespace'])
  })

  it('should reject the root alias when a layer alias is required', async () => {
    const code = lines("import { formatDate } from '~/shared/utils/date'", '', 'export const today = formatDate')

    expect(await ruleIdsOf(code, 'src/app/plugins/date.ts')).toEqual(['no-restricted-imports'])
  })

  it.each([
    ['zod', "import { z } from 'zod'", 'export const schema = z.string()'],
    ['vue', "import { ref } from 'vue'", 'export const counter = ref(0)'],
    ['Nitro', "import { createError } from 'h3'", 'export const failure = createError'],
    ['vitest', "import { describe } from 'vitest'", 'export const suite = describe']
  ])('should reject %s when imported by the contract package', async (_name, importLine, usageLine) => {
    const messages = await lintMessages(lines(importLine, '', usageLine), 'src/shared/contract/modules/news/limits.ts')

    expect(messages.map((message) => message.ruleId)).toEqual(['no-restricted-imports'])
    expect(messages[0]?.message).toContain('импортируются только файлы пакета')
  })

  it('should reject a Vue import when the test mirrors the Nuxt contract', async () => {
    const code = lines("import { ref } from 'vue'", '', 'export const counter = ref(0)')

    expect(await ruleIdsOf(code, 'tests/unit/shared/contract/note.test.ts')).toContain('no-restricted-imports')
  })

  it('should report only HTTP statuses when numeric fields and sizes coexist', async () => {
    const code = lines(
      'export const problemOf = (error: { status: number }, width: number): Record<string, unknown> => ({',
      '  status: 422,',
      '  isServerError: error.status >= 500,',
      '  width: width + 400,',
      '  limit: 500',
      '})'
    )

    expect(await ruleIdsOf(code, 'src/server/modules/news/utils/problem.ts')).toEqual([
      'no-restricted-syntax',
      'no-restricted-syntax'
    ])
  })

  it('should report a literal status when a response assertion uses a number', async () => {
    const code = lines(
      "import { describe, expect, it } from 'vitest'",
      '',
      "describe('News/controller', () => {",
      "  it('should return a response when the route exists', () => {",
      '    const response = { statusCode: 0, body: { length: 404 } }',
      '',
      '    expect(response.statusCode).toBe(200)',
      '    expect(response.body.length).toBe(404)',
      '  })',
      '})'
    )

    expect(await ruleIdsOf(code, 'tests/unit/server/modules/news/news.controller.spec.ts')).toEqual([
      'no-restricted-syntax'
    ])
  })

  it('should reject test titles when they violate the naming convention', async () => {
    const code = lines(
      "import { describe, expect, it } from 'vitest'",
      '',
      "describe('news service', () => {",
      "  it('works', () => {",
      '    expect(1).toBe(1)',
      '  })',
      '})'
    )

    expect(await ruleIdsOf(code, 'tests/unit/server/modules/news/services/news.service.spec.ts')).toEqual([
      'no-restricted-syntax',
      'vitest/valid-title'
    ])
  })

  it.each([
    ['setResponseStatus(event, 404)', 'src/server/api/sample.ts'],
    ['endpoint(handler, 201)', 'src/server/api/sample.ts'],
    ["new ApiError(404, 'missing', 'Missing')", 'src/server/api/sample.ts'],
    ['expect(response.status()).toBe(201)', 'tests/e2e/notes.spec.ts']
  ])('should reject a numeric HTTP status when checking %s', async (code, file) => {
    expect(await ruleIdsOf(code, file)).toContain('no-restricted-syntax')
  })

  it('should reject a relative import when it escapes shared', async () => {
    const code = lines("export { EditHistory } from '../../core/notes/history/edit-history'")

    expect(await ruleIdsOf(code, 'src/shared/contract/sample.ts')).toContain('import/no-restricted-paths')
  })

  it('should allow relative imports when checking the contract and its Vitest specs', async () => {
    expect(
      await ruleIdsOf(
        lines("import { NEWS_LIMITS } from './limits.js'", '', 'export const limit = NEWS_LIMITS'),
        'src/shared/contract/modules/news/index.ts'
      )
    ).toEqual([])

    expect(
      await ruleIdsOf(
        lines(
          "import { describe, expect, it } from 'vitest'",
          "import { NEWS_LIMITS } from './limits.js'",
          '',
          "describe('Shared/newsLimits', () => {",
          "  it('should expose limits when loading the contract', () => {",
          '    expect(NEWS_LIMITS).toBeDefined()',
          '  })',
          '})'
        ),
        'tests/unit/shared/contract/modules/news/limits.spec.ts'
      )
    ).toEqual([])
  })

  it.each([
    ['ref', 'src/core/notes/service.ts', 'export const counter = (): unknown => ref(0)'],
    ['useNuxtApp', 'src/core/notes/api.ts', 'export const app = (): unknown => useNuxtApp()'],
    ['computed', 'src/core/notes/adapter.ts', 'export const total = (): unknown => computed(() => 1)'],
    ['defineStore', 'src/core/notes/domain/sample.ts', 'export const store = (): unknown => defineStore'],
    ['useRoute', 'src/core/notes/api/sample.ts', 'export const route = (): unknown => useRoute()']
  ])('should reject %s when a pure domain file uses a framework auto-import', async (_name, file, code) => {
    const messages = await lintMessages(lines(code), file)

    expect(messages.map((message) => message.ruleId)).toEqual(['no-restricted-globals'])
    expect(messages[0]?.message).toContain('composition root')
  })

  it('should allow a framework auto-import when a composable uses it', async () => {
    const code = lines('export const useCounter = (): unknown => ref(0)')

    expect(await ruleIdsOf(code, 'src/core/notes/composables/useCounter.ts')).toEqual([])
  })

  it.each(['sessionStorage.getItem(key)', 'window.localStorage.getItem(key)'])(
    'should allow %s when the browser storage provider reads the storage',
    async (expression) => {
      const code = lines(`export const readItem = (key: string): string | null => ${expression}`)

      expect(await ruleIdsOf(code, 'src/shared/services/storage/browser-storage-provider.ts')).toEqual([])
    }
  )

  it('should reject fetch when the browser storage provider sends a request', async () => {
    const code = lines("export const load = (): Promise<Response> => fetch('/api/notes')")

    expect(await ruleIdsOf(code, 'src/shared/services/storage/browser-storage-provider.ts')).toEqual([
      'no-restricted-globals'
    ])
  })

  it.each(['sessionStorage', 'localStorage'])(
    'should allow %s when the composition root passes it to the provider',
    async (name) => {
      const code = lines(`export const storage = (): Storage => ${name}`)

      expect(await ruleIdsOf(code, 'src/app/plugins/services.ts')).toEqual([])
    }
  )

  it.each([
    ['fetch', 'src/app/plugins/services.ts', "export const load = (): Promise<Response> => fetch('/api/notes')"],
    ['sessionStorage', 'src/app/plugins/fonts.ts', 'export const storage = (): Storage => sessionStorage'],
    ['sessionStorage', 'src/shared/services/time/sample.ts', 'export const storage = (): Storage => sessionStorage']
  ])('should reject %s when %s reaches a browser global', async (_name, file, code) => {
    expect(await ruleIdsOf(lines(code), file)).toEqual(['no-restricted-globals'])
  })

  it.each([
    ['src/server/common/sample.ts', 'node:child_process'],
    ['src/server/modules/notes/repositories/sample.ts', 'child_process'],
    ['src/core/notes/utils/sample.ts', 'node:child_process'],
    ['src/shared/utils/sample.ts', 'child_process']
  ])('should reject the process API when %s imports %s', async (file, specifier) => {
    const messages = await lintMessages(
      lines(`import { exec } from '${specifier}'`, '', 'export const run = exec'),
      file
    )

    expect(messages.map((message) => message.ruleId)).toEqual(['no-restricted-imports'])
    expect(messages[0]?.message).toContain('child_process')
  })

  it('should reject the process API when the server imports it dynamically', async () => {
    const code = lines("export const load = (): Promise<unknown> => import('node:child_process')")

    expect(await ruleIdsOf(code, 'src/server/common/sample.ts')).toEqual(['no-restricted-syntax'])
  })

  it('should allow the process API when a test helper starts a server', async () => {
    const code = lines("import { spawn } from 'node:child_process'", '', 'export const start = spawn')

    expect(await ruleIdsOf(code, 'tests/setup/sample.ts')).not.toContain('no-restricted-imports')
  })

  it.each([
    ['sql.raw(column)', 'column: string'],
    ['sql.raw(`${column}`)', 'column: string'],
    ['sql.raw(String(limit))', 'limit: number'],
    ['sql.raw(input.sort)', 'input: { sort: string }']
  ])('should reject %s when raw SQL takes a runtime value', async (expression, parameter) => {
    const code = lines(
      "import { sql } from 'drizzle-orm'",
      '',
      `export const order = (${parameter}): unknown => ${expression}`
    )

    expect(await ruleIdsOf(code, 'src/server/modules/notes/repositories/sample.ts')).toEqual(['no-restricted-syntax'])
  })

  it.each([
    "sql.raw('lower')",
    'sql.raw(SEARCH_LOCALE)',
    'sql.raw(DATABASE_FUNCTIONS.UNICODE_LOWER)',
    'sql.raw(String(TITLE_LIMIT))',
    'sql.raw(`${DATABASE_FUNCTIONS.UNICODE_LOWER}(title)`)'
  ])('should allow %s when raw SQL takes a constant', async (expression) => {
    const code = lines(
      "import { sql } from 'drizzle-orm'",
      '',
      "export const SEARCH_LOCALE = 'und'",
      '',
      'export const TITLE_LIMIT = 200',
      '',
      "export const DATABASE_FUNCTIONS = { UNICODE_LOWER: 'unicode_lower' } as const",
      '',
      `export const fragment = (): unknown => ${expression}`
    )

    expect(await ruleIdsOf(code, 'src/server/modules/notes/repositories/sample.ts')).toEqual([])
  })

  it.each([
    ['new RegExp(pattern)', 'pattern: string'],
    ['RegExp(query.search)', 'query: { search: string }'],
    ["new RegExp(`^${pattern}`, 'u')", 'pattern: string']
  ])('should reject %s when a server pattern is built from a runtime value', async (expression, parameter) => {
    const code = lines(`export const matcher = (${parameter}): RegExp => ${expression}`)

    expect(await ruleIdsOf(code, 'src/server/common/http/sample.ts')).toEqual(['no-restricted-syntax'])
  })

  it.each(["new RegExp('^/api', 'u')", 'new RegExp(`^${API_PREFIX}(?:/|$)`, "iu")', 'new RegExp(ROUTE_PATTERN)'])(
    'should allow %s when a server pattern is built from constants',
    async (expression) => {
      const code = lines(
        "export const API_PREFIX = '/api'",
        '',
        "export const ROUTE_PATTERN = '^/api'",
        '',
        `export const matcher = (): RegExp => ${expression}`
      )

      expect(await ruleIdsOf(code, 'src/server/common/http/sample.ts')).toEqual([])
    }
  )

  it.each([
    ['eval(source)', 'no-eval'],
    ["new Function('source', source)", 'no-new-func'],
    ['setTimeout(`run(${source})`, 10)', 'no-implied-eval']
  ])('should reject %s when the server evaluates code', async (expression, ruleId) => {
    const code = lines(`export const run = (source: string): unknown => ${expression}`)

    expect(await ruleIdsOf(code, 'src/server/common/sample.ts')).toEqual([ruleId])
  })
})
