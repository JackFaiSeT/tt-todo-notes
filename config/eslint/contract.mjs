import { TEST_FILES, TEST_SYNTAX_RESTRICTIONS } from './base.mjs'
import { restrictedSyntaxRule } from './enumerations.mjs'
import { NUMERIC_HTTP_STATUS_RESTRICTIONS } from './http-status.mjs'

const CONTRACT_MESSAGE =
  'Пакет контракта без зависимостей от Vue, Nitro, zod и других библиотек: импортируются только файлы пакета'

const TEST_DEPENDENCIES = ['vitest']

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const packageImportsRule = (allowedPackages, message) => [
  'error',
  {
    patterns: [
      {
        regex: `^(?!\\.{1,2}/${allowedPackages.map((name) => `|${escapeRegExp(name)}(?:/|$)`).join('')})`,
        message
      }
    ]
  }
]

const directory = 'src/shared/contract'

export const contractConfigs = [
  {
    name: `notes/packages/${directory}/dependencies`,
    files: [`${directory}/**/*.{ts,mts}`],
    rules: {
      'no-restricted-imports': packageImportsRule(['@shared/contract'], CONTRACT_MESSAGE),
      'import/no-restricted-paths': [
        'error',
        {
          zones: [{ target: directory, from: './', except: [directory, 'node_modules'], message: CONTRACT_MESSAGE }]
        }
      ],
      'no-restricted-syntax': restrictedSyntaxRule(...NUMERIC_HTTP_STATUS_RESTRICTIONS),
      '@typescript-eslint/explicit-module-boundary-types': 'error'
    }
  },
  {
    name: `notes/packages/${directory}/tests`,
    files: TEST_FILES.map((pattern) => `tests/{unit,integration}/shared/contract/${pattern}`),
    rules: {
      'no-restricted-imports': packageImportsRule(['@shared/contract', ...TEST_DEPENDENCIES], CONTRACT_MESSAGE),
      'no-restricted-syntax': restrictedSyntaxRule(...TEST_SYNTAX_RESTRICTIONS, ...NUMERIC_HTTP_STATUS_RESTRICTIONS)
    }
  }
]
