import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { ESLint } from 'eslint'
import type { Linter } from 'eslint'
import { APP_ALIASES } from '../../../../../config/aliases.mts'
import { toPosixPath } from '../../../../../config/eslint/imports/resolver.mjs'
import { virtualSourceConfig } from '../../../../factories/eslint'

const ROOT = fileURLToPath(new URL('../../../../../', import.meta.url))

type ImportAlias = {
  name: string
  root: string
}

type ImportMessage = {
  ruleId: string
  message: string
}

const IMPORT_RULES = ['notes/import-order', 'notes/import-locality', 'notes/domain-order']

const lines = (...rows: string[]): string => `${rows.join('\n')}\n`

let eslint: ESLint

let fixer: ESLint

const importMessages = async (code: string, filePath: string): Promise<ImportMessage[]> => {
  const [result] = await eslint.lintText(code, { filePath })

  return (result?.messages ?? [])
    .filter((message) => IMPORT_RULES.includes(message.ruleId ?? ''))
    .map((message) => ({ ruleId: message.ruleId ?? '', message: message.message }))
}

const importRuleIds = async (code: string, filePath: string): Promise<string[]> =>
  (await importMessages(code, filePath)).map((message) => message.ruleId)

const fixImports = async (code: string, filePath: string): Promise<string> => {
  const [result] = await fixer.lintText(code, { filePath })

  return result?.output ?? code
}

const aliasPaths = (aliases: Readonly<Record<string, string>>): Record<string, string> =>
  Object.fromEntries(Object.entries(aliases).map(([name, path]) => [name, toPosixPath(path)]))

const lintedAliasPaths = async (): Promise<Record<string, string>> => {
  const config: Linter.Config = await eslint.calculateConfigForFile('src/shared/utils/sample.ts')
  const [, settings] = config.rules?.['notes/import-order'] as [unknown, { aliases: ImportAlias[] }]

  return Object.fromEntries(
    settings.aliases.filter((alias) => alias.name !== '#server').map((alias) => [alias.name, alias.root])
  )
}

describe('Config/eslintImports', () => {
  beforeAll(async () => {
    eslint = new ESLint({ cwd: ROOT, overrideConfig: virtualSourceConfig })

    fixer = new ESLint({
      cwd: ROOT,
      overrideConfig: virtualSourceConfig,
      fix: (message) => IMPORT_RULES.includes(message.ruleId ?? '')
    })

    await eslint.calculateConfigForFile('src/shared/utils/sample.ts')
  }, 60_000)

  it('should report a blank line when it separates sorted imports', async () => {
    const code = lines(
      "import { computed } from 'vue'",
      '',
      "import { ROUTE_PATHS } from '@shared/constants/routes'",
      '',
      'export const used = [computed, ROUTE_PATHS]'
    )

    expect(await importRuleIds(code, 'src/shared/utils/sample.ts')).toEqual(['notes/import-order'])
  })

  it('should resolve the Nuxt aliases when linting app sources', async () => {
    expect(await lintedAliasPaths()).toEqual(aliasPaths(APP_ALIASES))
  })

  it('should order deeper relative imports first when paths have different depths', async () => {
    const code = lines(
      "import { local } from './local'",
      "import { buildNews } from '../../factories/news.factory'",
      "import { parent } from '../parent'",
      "import { FIXTURE } from './constants'",
      "import { describe, expect, it } from 'vitest'",
      '',
      "describe('News/sample', () => {",
      "  it('should load dependencies when imports are sorted', () => {",
      '    expect([local, buildNews, parent, FIXTURE]).toHaveLength(4)',
      '  })',
      '})'
    )

    expect(await fixImports(code, 'tests/unit/core/notes/sample.test.ts')).toBe(
      lines(
        "import { describe, expect, it } from 'vitest'",
        "import { buildNews } from '../../factories/news.factory'",
        "import { parent } from '../parent'",
        "import { FIXTURE } from './constants'",
        "import { local } from './local'",
        '',
        "describe('News/sample', () => {",
        "  it('should load dependencies when imports are sorted', () => {",
        '    expect([local, buildNews, parent, FIXTURE]).toHaveLength(4)',
        '  })',
        '})'
      )
    )
  })

  it('should place the type import second when a module also has a value import', async () => {
    const code = lines(
      "import { computed } from 'vue'",
      "import { ROUTE_PATHS } from '@shared/constants/routes'",
      "import type { NNews } from '@notes/domain'",
      "import type { ComputedRef } from 'vue'",
      '',
      'export const route = (news: NNews.Page): ComputedRef<string> => computed(() => `${ROUTE_PATHS.NEWS}/${news.slug}`)'
    )

    expect(await importRuleIds(code, 'src/core/notes/composables/useSample.ts')).toEqual(['notes/import-order'])

    expect(await fixImports(code, 'src/core/notes/composables/useSample.ts')).toBe(
      lines(
        "import { computed } from 'vue'",
        "import type { ComputedRef } from 'vue'",
        "import { ROUTE_PATHS } from '@shared/constants/routes'",
        "import type { NNews } from '@notes/domain'",
        '',
        'export const route = (news: NNews.Page): ComputedRef<string> => computed(() => `${ROUTE_PATHS.NEWS}/${news.slug}`)'
      )
    )
  })

  it('should sort imports on either side when a side effect import separates groups', async () => {
    const code = lines(
      "import { local } from './local'",
      "import { ROUTE_PATHS } from '@shared/constants/routes'",
      "import './sample.css'",
      "import { other } from './other'",
      "import { computed } from 'vue'",
      '',
      'export const used = [local, ROUTE_PATHS, other, computed]'
    )

    expect(await fixImports(code, 'src/shared/utils/sample.ts')).toBe(
      lines(
        "import { ROUTE_PATHS } from '@shared/constants/routes'",
        "import { local } from './local'",
        "import './sample.css'",
        "import { computed } from 'vue'",
        "import { other } from './other'",
        '',
        'export const used = [local, ROUTE_PATHS, other, computed]'
      )
    )
  })

  it('should preserve multiline imports when removing blank lines and sorting', async () => {
    const code = lines(
      "import { ROUTE_PATHS } from '@shared/constants/routes'",
      '',
      'import {',
      '  computed,',
      '  shallowRef',
      "} from 'vue'",
      '',
      'export const used = [ROUTE_PATHS, computed, shallowRef]'
    )

    expect(await fixImports(code, 'src/shared/utils/sample.ts')).toBe(
      lines(
        'import {',
        '  computed,',
        '  shallowRef',
        "} from 'vue'",
        "import { ROUTE_PATHS } from '@shared/constants/routes'",
        '',
        'export const used = [ROUTE_PATHS, computed, shallowRef]'
      )
    )
  })

  it('should preserve attached comments when sorting imports', async () => {
    const code = lines(
      "import { ROUTE_PATHS } from '@shared/constants/routes' // routes",
      '/* reactivity */',
      "import { computed } from 'vue'",
      '',
      'export const used = [ROUTE_PATHS, computed]'
    )

    expect(await fixImports(code, 'src/shared/utils/sample.ts')).toBe(
      lines(
        '/* reactivity */',
        "import { computed } from 'vue'",
        "import { ROUTE_PATHS } from '@shared/constants/routes' // routes",
        '',
        'export const used = [ROUTE_PATHS, computed]'
      )
    )
  })

  it('should sort the two script blocks independently when a component contains both', async () => {
    const code = lines(
      '<script lang="ts">',
      "import { ROUTE_PATHS } from '@shared/constants/routes'",
      "import { computed } from 'vue'",
      '',
      'export const used = [ROUTE_PATHS, computed]',
      '</script>',
      '',
      '<script setup lang="ts">',
      "import { useSample } from './composables/useSample'",
      "import { UiSkeleton } from '@uikit/components'",
      '',
      'const { lines } = useSample()',
      '</script>',
      '',
      '<template>',
      '  <UiSkeleton :lines="lines" />',
      '</template>'
    )

    expect(await fixImports(code, 'src/core/notes/components/views/sample-view/index.vue')).toBe(
      lines(
        '<script lang="ts">',
        "import { computed } from 'vue'",
        "import { ROUTE_PATHS } from '@shared/constants/routes'",
        '',
        'export const used = [ROUTE_PATHS, computed]',
        '</script>',
        '',
        '<script setup lang="ts">',
        "import { UiSkeleton } from '@uikit/components'",
        "import { useSample } from './composables/useSample'",
        '',
        'const { lines } = useSample()',
        '</script>',
        '',
        '<template>',
        '  <UiSkeleton :lines="lines" />',
        '</template>'
      )
    )
  })

  it('should order by segment name when relative imports have equal depth', async () => {
    const code = lines(
      '<script setup lang="ts">',
      "import { NEWS_WIDGET_SKELETON_LINES } from './constants'",
      "import { UiSkeleton } from '@uikit/components'",
      "import SampleCard from './components/sample-card/index.vue'",
      "import { useSample } from './composables/useSample'",
      '',
      'const { lines } = useSample(NEWS_WIDGET_SKELETON_LINES)',
      '</script>',
      '',
      '<template>',
      '  <UiSkeleton :lines="lines" />',
      '  <SampleCard />',
      '</template>'
    )

    expect(await fixImports(code, 'src/core/notes/components/views/sample-view/index.vue')).toBe(
      lines(
        '<script setup lang="ts">',
        "import { UiSkeleton } from '@uikit/components'",
        "import { NEWS_WIDGET_SKELETON_LINES } from './constants'",
        "import { useSample } from './composables/useSample'",
        "import SampleCard from './components/sample-card/index.vue'",
        '',
        'const { lines } = useSample(NEWS_WIDGET_SKELETON_LINES)',
        '</script>',
        '',
        '<template>',
        '  <UiSkeleton :lines="lines" />',
        '  <SampleCard />',
        '</template>'
      )
    )
  })

  it('should order server module segments from data access to services when a module wires them', async () => {
    const code = lines(
      "import { SampleService } from './services/sample.service'",
      "import { SampleRepository } from './repositories/sample.repository'",
      "import type { ISampleService } from './types'",
      '',
      'export const create = (): ISampleService => new SampleService(new SampleRepository())'
    )

    expect(await fixImports(code, 'src/server/modules/sample/sample.module.ts')).toBe(
      lines(
        "import type { ISampleService } from './types'",
        "import { SampleRepository } from './repositories/sample.repository'",
        "import { SampleService } from './services/sample.service'",
        '',
        'export const create = (): ISampleService => new SampleService(new SampleRepository())'
      )
    )
  })

  it('should use the domain alias when a module imports a sibling segment', async () => {
    const code = lines("import { PREVIEW_KEY } from '../constants'", '', 'export const used = PREVIEW_KEY')

    expect(await fixImports(code, 'src/core/notes/composables/useSample.ts')).toBe(
      lines("import { PREVIEW_KEY } from '@notes/constants'", '', 'export const used = PREVIEW_KEY')
    )
  })

  it('should use the server alias when a module imports another server folder', async () => {
    const code = lines("import { requestIdOf } from '../utils/request-id'", '', 'export const used = requestIdOf')

    expect(await fixImports(code, 'src/server/plugins/sample.ts')).toBe(
      lines("import { requestIdOf } from '#server/utils/request-id'", '', 'export const used = requestIdOf')
    )
  })

  it('should use an alias for sibling directories when resolving root E2E imports', async () => {
    const code = lines(
      "import { expect, test } from '../../fixtures'",
      "import { waitForHydration } from '../../support/hydration'",
      "import { openPreview } from '../preview/support'",
      '',
      'export const used = [expect, test, waitForHydration, openPreview]'
    )

    expect(await fixImports(code, 'tests/e2e/flows/home/sample.ts')).toBe(
      lines(
        "import { expect, test } from '@e2e/fixtures'",
        "import { waitForHydration } from '@e2e/support/hydration'",
        "import { openPreview } from '../preview/support'",
        '',
        'export const used = [expect, test, waitForHydration, openPreview]'
      )
    )
  })

  it('should use a relative path when the E2E alias points to the same folder', async () => {
    const code = lines("import { E2E_API_URL } from '@e2e/support/environment'", '', 'export const used = E2E_API_URL')

    expect(await fixImports(code, 'tests/e2e/support/sample.ts')).toBe(
      lines("import { E2E_API_URL } from './environment'", '', 'export const used = E2E_API_URL')
    )
  })

  it('should sort the contract separately when an E2E module imports both shared zones', async () => {
    const code = lines(
      "import { value } from '@shared/constants/state'",
      "import { HTTP_STATUS } from '@shared/contract/http'",
      '',
      'export const used = [value, HTTP_STATUS]'
    )

    expect(await fixImports(code, 'tests/e2e/flows/home/sample.ts')).toBe(
      lines(
        "import { HTTP_STATUS } from '@shared/contract/http'",
        "import { value } from '@shared/constants/state'",
        '',
        'export const used = [value, HTTP_STATUS]'
      )
    )
  })

  it('should retain the nested alias when importing from the parent layer root', async () => {
    const code = lines("import { UiButton } from '@uikit/components'", '', 'export const used = UiButton')

    expect(await importRuleIds(code, 'src/shared/sample.ts')).toEqual([])
  })
})
