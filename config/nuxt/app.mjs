import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const CORE_DIR = './src/core'

export const LAYER_ALIAS_PATHS = Object.freeze({
  '@shared/contract': './src/shared/contract',
  '@base': './src/shared/components/base',
  '@uikit': './src/shared/uikit',
  '@shared': './src/shared',
  '@assets': './src/shared/assets',
  '@app': './src/app'
})

export const createAppPaths = (appRoot) => {
  const resolveAppPath = (path) => fileURLToPath(new URL(path, appRoot))

  const coreDir = resolveAppPath(CORE_DIR)

  const domainAliasPaths = existsSync(coreDir)
    ? readdirSync(coreDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => [`@${entry.name}`, `${CORE_DIR}/${entry.name}`])
    : []

  const appAliases = Object.freeze(
    Object.fromEntries(
      [...Object.entries(LAYER_ALIAS_PATHS), ...domainAliasPaths].map(([alias, path]) => [alias, resolveAppPath(path)])
    )
  )

  return { resolveAppPath, appAliases }
}

export const NUXT_APP_LAYOUT = Object.freeze({
  srcDir: 'src',
  serverDir: './src/server',
  dir: {
    public: './src/public',
    app: 'app',
    layouts: 'app/layouts',
    middleware: 'app/middleware',
    pages: 'app/pages',
    plugins: 'app/plugins'
  },
  components: { dirs: [] },
  imports: { scan: false },
  pages: { pattern: ['**/*.vue', '!**/components/**'] }
})

export const resolveAppComponents = (resolveAppPath) => (app) => {
  app.layouts = Object.fromEntries(
    Object.entries(app.layouts).filter(([, layout]) => /[/\\]index\.vue$/u.test(layout.file))
  )

  app.mainComponent = resolveAppPath('./src/app/app.vue')
  app.errorComponent = resolveAppPath('./src/app/error.vue')
}

const strictTsConfig = createRequire(import.meta.url)('../tsconfig/strict.json')

export const NUXT_TYPESCRIPT = Object.freeze({
  strict: true,
  tsConfig: { compilerOptions: strictTsConfig.compilerOptions }
})
