import vueAccessibility from 'eslint-plugin-vuejs-accessibility'
import { readAutoImportNames } from './auto-imports.mjs'
import { E2E_FILES, TEST_FILES, TEST_SYNTAX_RESTRICTIONS } from './base.mjs'
import { restrictedSyntaxRule } from './enumerations.mjs'
import { NUMERIC_HTTP_STATUS_RESTRICTIONS } from './http-status.mjs'
import { createAppImportSettings } from './imports/app-settings.mjs'
import { CHILD_PROCESS_IMPORT_PATHS, SERVER_EVAL_RULES, SERVER_SECURITY_RESTRICTIONS } from './security.mjs'

const APP_SOURCE = '{ts,mts,vue}'

const HTTP_CLIENT_DIR = 'src/shared/services/http'

const STORAGE_PROVIDER_DIR = 'src/shared/services/storage'

const COMPOSITION_ROOT_FILE = 'src/app/plugins/services.ts'

const DOMAIN_TYPE_FILES = 'src/core/*/domain/{index,data-contracts}.ts'

const PURE_DOMAIN_FILES = ['src/core/*/{api,adapter,service}.ts', 'src/core/*/{api,adapter,service,domain}/**/*.ts']

const SERVER_FILES = ['src/server/**/*.{ts,mts}']

const HTTP_CLIENT_MESSAGE =
  'Запросы к API идут только через HTTP-клиент @shared/services/http: $fetch и useFetch вызываются в src/shared/services/http'

const BROWSER_STORAGE_MESSAGE =
  'Хранилище браузера читает провайдер @shared/services/storage, его создаёт composition root; остальной код получает хранилище через порт'

const PURE_DOMAIN_MESSAGE =
  'api, adapter, service и domain/ домена не зависят от Vue, Nuxt и Pinia: состояние и окружение приходят конструктором из composition root'

const HTTP_TRANSPORT_NAMES = ['$fetch', 'useFetch', 'useLazyFetch']

const BROWSER_STORAGE_NAMES = ['localStorage', 'sessionStorage']

const HTTP_TRANSPORT_GLOBALS = [...HTTP_TRANSPORT_NAMES, 'fetch'].map((name) => ({
  name,
  message: HTTP_CLIENT_MESSAGE
}))

const storageGlobals = (names) => names.map((name) => ({ name, message: BROWSER_STORAGE_MESSAGE }))

const restrictedGlobals = (globals) => ['error', { checkGlobalObject: true, globals }]

const pureDomainGlobals = (rootDir) => {
  const restricted = [...HTTP_TRANSPORT_GLOBALS, ...storageGlobals(BROWSER_STORAGE_NAMES)]
  const restrictedNames = new Set(restricted.map(({ name }) => name))

  return [
    ...restricted,
    ...readAutoImportNames(rootDir)
      .filter((name) => !restrictedNames.has(name))
      .map((name) => ({ name, message: PURE_DOMAIN_MESSAGE }))
  ]
}

const NUXT_IMPORT_SOURCES = ['#imports', '#app', 'nuxt/app']

const ROOT_ALIAS_IMPORT = {
  regex: '^(~~?|@@?)(/|$)',
  message:
    'Корневые алиасы Nuxt (~, ~~, @, @@) скрывают слой модуля: импортируйте через алиас слоя @base, @uikit, @shared, @<домен>, @app'
}

const TARGET_BLANK_WITHOUT_REL =
  "VStartTag:has(VAttribute[directive=false][key.name='target'][value.value='_blank']):not(:has(VAttribute[directive=false][key.name='rel'][value.value=/(?=.*\\bnoopener\\b)(?=.*\\bnoreferrer\\b)/]))"

const EMPTY_STRING_ERROR_PROP =
  "VAttribute[directive=true][key.name.name='bind'][key.argument.name='error'] > VExpressionContainer > LogicalExpression[right.type='Literal'][right.value='']"

const httpTransportImportPaths = NUXT_IMPORT_SOURCES.map((name) => ({
  name,
  importNames: HTTP_TRANSPORT_NAMES,
  message: HTTP_CLIENT_MESSAGE
}))

const restrictedImports = (paths) => ['error', { paths, patterns: [ROOT_ALIAS_IMPORT] }]

const appConfigs = (rootDir) => {
  const sourceFiles = [`src/{app,core,shared}/**/*.${APP_SOURCE}`]
  const httpClientFiles = [`${HTTP_CLIENT_DIR}/**`]
  const importSettings = createAppImportSettings({ rootDir })

  return [
    {
      name: 'notes/vue/import-order',
      files: [`{src,tests}/**/*.${APP_SOURCE}`],
      ignores: E2E_FILES,
      rules: {
        'notes/import-order': ['error', importSettings]
      }
    },
    {
      name: 'notes/vue/import-locality',
      files: [`{src,tests}/**/*.${APP_SOURCE}`],
      ignores: E2E_FILES,
      rules: {
        'notes/import-locality': ['error', importSettings]
      }
    },
    {
      name: 'notes/vue/domain-order',
      files: [`src/core/**/*.${APP_SOURCE}`],
      rules: {
        'notes/domain-order': ['error', importSettings]
      }
    },
    {
      name: 'notes/vue/imports',
      files: [`{src,tests}/**/*.${APP_SOURCE}`],
      rules: {
        'no-restricted-imports': restrictedImports([])
      }
    },
    {
      name: 'notes/vue/source-imports',
      files: [`src/**/*.${APP_SOURCE}`],
      rules: {
        'no-restricted-imports': restrictedImports(CHILD_PROCESS_IMPORT_PATHS)
      }
    },
    {
      name: 'notes/vue/http-client',
      files: sourceFiles,
      ignores: [...httpClientFiles, 'src/shared/contract/**'],
      rules: {
        'no-restricted-globals': restrictedGlobals([
          ...HTTP_TRANSPORT_GLOBALS,
          ...storageGlobals(BROWSER_STORAGE_NAMES)
        ]),
        'no-restricted-imports': restrictedImports([
          ...CHILD_PROCESS_IMPORT_PATHS,
          ...httpTransportImportPaths,
          { name: 'ofetch', message: HTTP_CLIENT_MESSAGE }
        ])
      }
    },
    {
      name: 'notes/vue/http-storage',
      files: httpClientFiles,
      rules: {
        'no-restricted-globals': restrictedGlobals(storageGlobals(BROWSER_STORAGE_NAMES))
      }
    },
    {
      name: 'notes/vue/browser-storage',
      files: [`${STORAGE_PROVIDER_DIR}/**`],
      rules: {
        'no-restricted-globals': restrictedGlobals(HTTP_TRANSPORT_GLOBALS)
      }
    },
    {
      name: 'notes/vue/composition-root-storage',
      files: [COMPOSITION_ROOT_FILE],
      rules: {
        'no-restricted-globals': restrictedGlobals(HTTP_TRANSPORT_GLOBALS)
      }
    },
    {
      name: 'notes/vue/pure-domain',
      files: PURE_DOMAIN_FILES,
      rules: {
        'no-restricted-globals': restrictedGlobals(pureDomainGlobals(rootDir))
      }
    },
    {
      name: 'notes/vue/http-status',
      files: [`{src,tests}/**/*.${APP_SOURCE}`],
      ignores: [...TEST_FILES, ...E2E_FILES],
      rules: {
        'no-restricted-syntax': restrictedSyntaxRule(...NUMERIC_HTTP_STATUS_RESTRICTIONS)
      }
    },
    {
      name: 'notes/vue/server-security',
      files: SERVER_FILES,
      rules: {
        ...SERVER_EVAL_RULES,
        'no-restricted-syntax': restrictedSyntaxRule(
          ...NUMERIC_HTTP_STATUS_RESTRICTIONS,
          ...SERVER_SECURITY_RESTRICTIONS
        )
      }
    },
    {
      name: 'notes/vue/tests-http-status',
      files: TEST_FILES,
      ignores: E2E_FILES,
      rules: {
        'no-restricted-syntax': restrictedSyntaxRule(...TEST_SYNTAX_RESTRICTIONS, ...NUMERIC_HTTP_STATUS_RESTRICTIONS)
      }
    },
    {
      name: 'notes/vue/typed-client',
      files: sourceFiles,
      ignores: ['src/shared/contract/**'],
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir: rootDir, extraFileExtensions: ['.vue'] }
      },
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        'max-params': ['error', 2]
      }
    },
    {
      name: 'notes/vue/store-id',
      files: sourceFiles,
      ignores: ['src/shared/contract/**'],
      rules: {
        'no-restricted-syntax': restrictedSyntaxRule(...NUMERIC_HTTP_STATUS_RESTRICTIONS, {
          selector:
            "CallExpression[callee.name='defineStore'] > :matches(Literal, TemplateLiteral[expressions.length=0]).arguments:first-child",
          message: 'Use a store ID from the shared factory'
        })
      }
    },
    {
      name: 'notes/vue/module-boundary-types',
      files: [`src/**/*.${APP_SOURCE}`],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'error'
      }
    },
    {
      name: 'notes/vue/domain-namespaces',
      files: [DOMAIN_TYPE_FILES],
      rules: {
        '@typescript-eslint/no-namespace': 'off'
      }
    }
  ]
}

export const createVueConfig = ({ rootDir }) => [
  {
    name: 'notes/vue/components',
    files: ['src/**/*.vue'],
    plugins: { 'vuejs-accessibility': vueAccessibility },
    rules: {
      ...vueAccessibility.configs.recommended.rules,
      'vuejs-accessibility/label-has-for': ['error', { required: { some: ['id', 'nesting'] } }],
      'vue/multi-word-component-names': 'off',
      'vue/no-setup-props-reactivity-loss': 'error',
      'vue/no-v-html': 'error',
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/require-explicit-emits': 'error',
      'vue/no-template-target-blank': 'off',
      'vue/no-restricted-syntax': [
        'error',
        {
          selector: TARGET_BLANK_WITHOUT_REL,
          message: 'Ссылка с target="_blank" задаёт rel="noopener noreferrer"'
        },
        {
          selector: EMPTY_STRING_ERROR_PROP,
          message:
            'Пустая строка в :error превращается в true у пропа Boolean | String: поле считается ошибочным и прячет ошибку формы — опустите проп через v-bind'
        }
      ]
    }
  },
  ...appConfigs(rootDir)
]
