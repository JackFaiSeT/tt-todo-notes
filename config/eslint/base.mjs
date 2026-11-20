import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { includeIgnoreFile } from '@eslint/compat'
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import vitest from '@vitest/eslint-plugin'
import prettier from 'eslint-config-prettier'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import playwright from 'eslint-plugin-playwright'
import globals from 'globals'
import { readTsconfigPaths } from '../tsconfig/paths.mjs'
import { restrictedSyntaxRule } from './enumerations.mjs'
import { NUMERIC_HTTP_STATUS_RESTRICTIONS } from './http-status.mjs'
import { importsPlugin } from './imports/plugin.mjs'
import { toPosixPath } from './imports/resolver.mjs'
import { stylePlugin } from './style/plugin.mjs'

export const TS_FILES = ['**/*.{ts,mts,cts,vue}']

export const TEST_FILES = ['**/*.{test,spec}.{ts,mts}']

export const E2E_FILES = ['tests/e2e/**']

export const E2E_SPEC_FILES = E2E_FILES.map((directory) => `${directory}/*.spec.ts`)

const E2E_SOURCE_FILES = E2E_FILES.map((directory) => `${directory}/*.{ts,mts,js,mjs}`)

const E2E_TSCONFIG = 'tests/e2e/tsconfig.json'

const E2E_UNIT_DEPTH = 1

export const NODE_TOOLING_FILES = ['scripts/**', '*.config.{ts,mts,js,mjs,cjs}']

const ignoreConfigs = (rootDir) =>
  ['.git/info/exclude', '.gitignore']
    .map((file) => join(rootDir, file))
    .filter((file) => existsSync(file))
    .map((file) => includeIgnoreFile(file))

const TEST_TITLE_REFERENCE = String.raw`\b(?:REQ|AFR|FR|NFR|ADR|ARCH|KI|Q|AP|TZ)[-–— :]+\d+(?:\.\d+)*|(?:^|\s|\()ТЗ\s*[§№]?\s*\d+|\bWCAG\s+\d+(?:\.\d+)*|\((?:\d+(?:[./]\d+)+(?:,\s*\d+(?:[./]\d+)+)*|[\w./-]+\.md|design-fidelity)\)`

const TEST_TITLE_REFERENCE_MESSAGE = 'Опишите в имени теста проверяемое поведение и условия его выполнения'

const TOP_LEVEL_DESCRIBE_TITLE = '/^[A-Z][A-Za-z0-9]*\\/[A-Za-z][A-Za-z0-9.]*$/u'

const TEST_TEMPLATE_TITLE_RESTRICTIONS = [
  {
    selector: `CallExpression > TemplateLiteral.arguments:first-child:has(TemplateElement:first-child[value.raw=/^should /]) > TemplateElement[value.raw=/${TEST_TITLE_REFERENCE.replaceAll('/', '\\/')}/]`,
    message: TEST_TITLE_REFERENCE_MESSAGE
  }
]

export const TEST_SYNTAX_RESTRICTIONS = [
  ...TEST_TEMPLATE_TITLE_RESTRICTIONS,
  {
    selector: `Program > ExpressionStatement > CallExpression[callee.name='describe'] > Literal.arguments:first-child:not([value=${TOP_LEVEL_DESCRIBE_TITLE}])`,
    message: "Внешний describe называется '<Домен>/<Модуль>': 'Scripts/commentRules', 'App/createApp'"
  },
  {
    selector: "Program > ExpressionStatement > CallExpression[callee.name='describe'] > TemplateLiteral.arguments",
    message: "Внешний describe называется строкой '<Домен>/<Модуль>' без подстановок"
  }
]

const STATEMENT_PADDING = [
  { blankLine: 'always', prev: 'import', next: '*' },
  { blankLine: 'any', prev: 'import', next: 'import' },
  { blankLine: 'always', prev: ['const', 'let'], next: '*' },
  { blankLine: 'any', prev: ['singleline-const', 'singleline-let'], next: ['singleline-const', 'singleline-let'] },
  { blankLine: 'always', prev: '*', next: ['multiline-const', 'multiline-let'] },
  { blankLine: 'always', prev: ['block-like', 'multiline-expression'], next: '*' },
  { blankLine: 'always', prev: '*', next: ['block-like', 'multiline-expression'] },
  { blankLine: 'any', prev: ['case', 'default'], next: '*' },
  { blankLine: 'always', prev: 'expression', next: ['const', 'let'] },
  { blankLine: 'always', prev: '*', next: 'return' },
  { blankLine: 'always', prev: 'directive', next: '*' }
]

const resolverProjects = (rootDir) =>
  [E2E_TSCONFIG, '.nuxt/tsconfig.app.json', '.nuxt/tsconfig.server.json', 'tests/tsconfig.json'].map((file) =>
    join(rootDir, file)
  )

const nuxtDirs = {
  root: ['.'],
  src: ['src'],
  pages: ['src/app/pages'],
  layouts: ['src/app/layouts'],
  plugins: ['src/app/plugins'],
  middleware: ['src/app/middleware']
}

export const importResolverSettings = ({ rootDir }) => ({
  'import-x/extensions': ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.vue'],
  'import-x/ignore': ['node_modules'],
  'import-x/parsers': {
    'vue-eslint-parser': ['.vue'],
    '@typescript-eslint/parser': ['.ts', '.mts', '.cts']
  },
  'import-x/resolver-next': [
    createTypeScriptImportResolver({
      project: resolverProjects(rootDir),
      alwaysTryTypes: true,
      noWarnOnMultipleProjects: true
    })
  ]
})

const e2eImportRules = (rootDir) => {
  const settings = {
    appRoot: toPosixPath(rootDir),
    aliases: readTsconfigPaths(join(rootDir, E2E_TSCONFIG)).map(({ name, target }) => ({
      name,
      root: target,
      unitDepth: E2E_UNIT_DEPTH
    }))
  }

  return {
    'notes/import-order': ['error', settings],
    'notes/import-locality': ['error', settings]
  }
}

export const createBaseConfigs = ({ rootDir }) => [
  {
    name: 'notes/base/settings',
    plugins: { notes: importsPlugin, 'notes-style': stylePlugin },
    languageOptions: {
      globals: { ...globals.node }
    },
    settings: importResolverSettings({ rootDir }),
    rules: {
      'no-console': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
      'padding-line-between-statements': ['error', ...STATEMENT_PADDING],
      'notes-style/declaration-padding': 'error',
      'notes-style/multiline-type-literal': 'error',
      'notes-style/named-type-argument': 'error',
      'notes-style/no-object-method': 'error',
      'notes-style/type-member-style': 'error',
      'notes/import-order': ['error', {}],
      'import/first': 'error',
      'import/no-cycle': 'error',
      'import/no-duplicates': 'error'
    }
  },
  {
    name: 'notes/base/e2e-imports',
    files: E2E_SOURCE_FILES,
    rules: e2eImportRules(rootDir)
  },
  {
    name: 'notes/base/typescript',
    files: TS_FILES,
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-extraneous-class': 'off',
      'no-restricted-syntax': restrictedSyntaxRule()
    }
  },
  {
    name: 'notes/base/tests',
    files: TEST_FILES,
    ignores: E2E_FILES,
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/require-top-level-describe': 'error',
      'vitest/max-nested-describe': ['error', { max: 2 }],
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
      'vitest/prefer-hooks-on-top': 'error',
      'vitest/no-conditional-in-test': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/no-standalone-expect': 'error',
      'vitest/valid-title': [
        'error',
        {
          mustMatch: {
            it: ['^should .+ when .+', "Кейс описывает результат и условие в форме 'should … when …'"],
            test: ['^should .+ when .+', "Кейс описывает результат и условие в форме 'should … when …'"]
          },
          mustNotMatch: {
            it: [TEST_TITLE_REFERENCE, TEST_TITLE_REFERENCE_MESSAGE],
            test: [TEST_TITLE_REFERENCE, TEST_TITLE_REFERENCE_MESSAGE]
          }
        }
      ],
      'no-restricted-syntax': restrictedSyntaxRule(...TEST_SYNTAX_RESTRICTIONS)
    }
  },
  {
    name: 'notes/base/e2e',
    files: E2E_SPEC_FILES,
    plugins: { playwright },
    rules: {
      'playwright/valid-title': [
        'error',
        {
          mustMatch: {
            test: ['^should .+ when .+', "Кейс описывает результат и условие в форме 'should … when …'"]
          },
          mustNotMatch: { test: [TEST_TITLE_REFERENCE, TEST_TITLE_REFERENCE_MESSAGE] }
        }
      ],
      'playwright/require-top-level-describe': 'error',
      'playwright/max-nested-describe': ['error', { max: 2 }],
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': ['error', { allowConditional: true }]
    }
  },
  {
    name: 'notes/base/e2e-http-status',
    files: E2E_FILES.map((directory) => `${directory}/*.ts`),
    rules: {
      'no-restricted-syntax': restrictedSyntaxRule(
        ...TEST_TEMPLATE_TITLE_RESTRICTIONS,
        ...NUMERIC_HTTP_STATUS_RESTRICTIONS
      )
    }
  },
  {
    name: 'notes/base/e2e-readiness',
    files: E2E_FILES.map((directory) => `${directory}/*.ts`),
    plugins: { playwright },
    rules: {
      'playwright/no-networkidle': 'error'
    }
  },
  {
    name: 'notes/base/node-tooling',
    files: NODE_TOOLING_FILES,
    rules: {
      'no-console': 'off'
    }
  }
]

export const FINAL_CONFIGS = [
  prettier,
  {
    name: 'notes/base/braces',
    rules: {
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'as-needed']
    }
  },
  {
    name: 'notes/base/linter-options',
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error'
    }
  }
]

export const defineRepoConfig = ({ rootDir }, ...presetConfigs) =>
  createConfigForNuxt({
    features: {
      standalone: true,
      typescript: true,
      stylistic: false,
      tooling: false,
      import: { package: 'eslint-plugin-import-x' }
    },
    dirs: nuxtDirs
  })
    .prepend(...ignoreConfigs(rootDir))
    .append(...createBaseConfigs({ rootDir }), ...presetConfigs, ...FINAL_CONFIGS)
