export const PACKAGE_RANKS = Object.freeze([
  Object.freeze({ name: 'test-environment', patterns: ['vitest', '@playwright/test', '@axe-core/playwright'] }),
  Object.freeze({ name: 'framework', patterns: ['vue', 'vue-router', '@vue/*'] }),
  Object.freeze({ name: 'runtime', patterns: ['nuxt', '#*', 'virtual:*', 'h3', 'nitropack'] }),
  Object.freeze({ name: 'state', patterns: ['pinia', '@pinia/*'] }),
  Object.freeze({ name: 'data', patterns: ['drizzle-orm', 'better-sqlite3'] }),
  Object.freeze({ name: 'libraries', patterns: [] })
])

export const DEFAULT_PACKAGE_RANK = 'libraries'

export const NUXT_LAYER_ORDER = Object.freeze([
  '@base',
  '@uikit',
  '@assets',
  '@app',
  '#server',
  '@shared/contract',
  '@shared'
])

export const NUXT_SEGMENT_ORDER = Object.freeze([
  'constants',
  'composables',
  'stores',
  'utils',
  'types',
  'domain',
  'services',
  'components'
])

export const SERVER_SEGMENT_ORDER = Object.freeze([
  'constants',
  'types',
  'errors',
  'utils',
  'ports',
  'dto',
  'mappers',
  'repositories',
  'adapters',
  'providers',
  'services'
])

export const SERVER_ALIAS_PATHS = Object.freeze({ '#server': './src/server' })
