import { cp } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { defineNuxtConfig } from 'nuxt/config'
import { APP_ALIASES, CONTRACT_ALIASES, resolveAppPath } from './config/aliases.mts'
import { NUXT_APP_LAYOUT, NUXT_TYPESCRIPT, resolveAppComponents } from './config/nuxt/app.mjs'
import { APP_NAME } from './src/app/constants'
import { MIGRATIONS_DIRECTORY, SOURCE_MIGRATIONS_PATH } from './src/server/config/migrations'
import { FONT_WEIGHTS } from './src/shared/constants/fonts'
import { SERVER_HEADERS } from './src/server/common/http/headers'

const envs = process.env

const isEslintEnabled = envs.NUXT_ENABLE_ESLINT === 'true'

const isTypecheckEnabled = envs.NUXT_ENABLE_TYPECHECK === 'true'

const isDevtoolsEnabled = envs.NUXT_ENABLE_DEVTOOLS === 'true'

const testBuildRoot = `${envs.NOTES_TEST_BUILD_ROOT || ''}`.trim()

const FAVICON_PATH = '/notebook.svg'

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'"
].join('; ')

const FONT_SUBSETS = ['cyrillic', 'latin']

const fontStylesheets = FONT_SUBSETS.flatMap((subset) =>
  FONT_WEIGHTS.map((weight) => `@fontsource/roboto/${subset}-${weight}.css`)
)

const optionalModules = [isEslintEnabled && '@nuxt/eslint'].filter(
  (module): module is string => typeof module === 'string'
)

const toPosixPath = (path: string): string => path.split('\\').join('/')

export default defineNuxtConfig({
  ...NUXT_APP_LAYOUT,

  ...(testBuildRoot ? { buildDir: join(testBuildRoot, 'nuxt') } : {}),

  alias: APP_ALIASES,

  hooks: {
    'app:resolve': resolveAppComponents(resolveAppPath)
  },

  ssr: false,

  experimental: {
    entryImportMap: false
  },

  devtools: { enabled: isDevtoolsEnabled },

  modules: ['@pinia/nuxt', ...optionalModules],

  typescript: {
    ...NUXT_TYPESCRIPT,
    typeCheck: isTypecheckEnabled
  },

  routeRules: {
    [FAVICON_PATH]: {
      headers: { [SERVER_HEADERS.CACHE_CONTROL]: 'public, max-age=86400' }
    },
    '/**': {
      headers: {
        [SERVER_HEADERS.CONTENT_SECURITY_POLICY]: CONTENT_SECURITY_POLICY,
        [SERVER_HEADERS.CONTENT_TYPE_OPTIONS]: 'nosniff',
        [SERVER_HEADERS.REFERRER_POLICY]: 'no-referrer'
      }
    }
  },

  runtimeConfig: {
    allowedHost: '',
    databasePath: '.data/notes.sqlite',
    migrationsPath: SOURCE_MIGRATIONS_PATH
  },

  nitro: {
    preset: 'node-server',
    alias: CONTRACT_ALIASES,
    compressPublicAssets: { gzip: true, brotli: true },
    ...(testBuildRoot ? { output: { dir: join(testBuildRoot, 'output') } } : {}),
    errorHandler: '#server/common/errors/nitro-handler',
    typescript: { tsConfig: NUXT_TYPESCRIPT.tsConfig },
    externals: { external: ['better-sqlite3'] },
    hooks: {
      'rollup:before': (nitro) => {
        if (nitro.options.dev) {
          return
        }

        const builtMigrationsPath = join(nitro.options.output.serverDir, MIGRATIONS_DIRECTORY)

        nitro.options.runtimeConfig.migrationsPath = toPosixPath(relative(nitro.options.rootDir, builtMigrationsPath))
      },
      compiled: async (nitro) => {
        const sourceMigrationsPath = join(nitro.options.rootDir, SOURCE_MIGRATIONS_PATH)
        const builtMigrationsPath = join(nitro.options.output.serverDir, MIGRATIONS_DIRECTORY)

        await cp(sourceMigrationsPath, builtMigrationsPath, { recursive: true })
      }
    }
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'ru' },
      title: APP_NAME,
      meta: [
        { property: 'og:site_name', content: APP_NAME },
        { property: 'og:locale', content: 'ru_RU' },
        { property: 'og:type', content: 'website' }
      ],
      link: [{ rel: 'icon', href: FAVICON_PATH, type: 'image/svg+xml' }]
    }
  },

  css: [...fontStylesheets, '@assets/styles/global.scss'],

  ...(isEslintEnabled
    ? {
        eslint: {
          checker: {
            eslintPath: 'eslint'
          }
        }
      }
    : {}),

  compatibilityDate: '2026-11-01'
})
