import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { LAYER_ALIAS_PATHS } from '../../nuxt/app.mjs'
import { SERVER_ALIAS_PATHS, SERVER_SEGMENT_ORDER } from './ranks.mjs'
import { toPosixPath } from './resolver.mjs'

const CORE_DIR = 'src/core'

const DOMAIN_ORDER_FILE = 'config/domain-order.mjs'

const requireModule = createRequire(import.meta.url)

const readDirs = (directory) =>
  existsSync(directory)
    ? readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : []

export const readDomainDirs = (appRoot) => readDirs(join(appRoot, CORE_DIR))

const readOrder = (appRoot, file, name) => {
  const path = join(appRoot, file)

  return existsSync(path) ? [...requireModule(path)[name]] : []
}

export const readDomainOrder = (appRoot) => readOrder(appRoot, DOMAIN_ORDER_FILE, 'DOMAIN_ORDER')

const toAlias = (appRoot, name, path, domain) => ({
  name,
  root: toPosixPath(join(appRoot, path)),
  ...(domain === undefined ? {} : { domain }),
  ...(name in SERVER_ALIAS_PATHS ? { segmentOrder: [...SERVER_SEGMENT_ORDER] } : {})
})

export const createAppImportSettings = ({ rootDir: appRoot }) => {
  const serverAliases = Object.entries(SERVER_ALIAS_PATHS).filter(([, path]) => existsSync(join(appRoot, path)))

  return {
    appRoot: toPosixPath(appRoot),
    domainOrder: readDomainOrder(appRoot),
    aliases: [
      ...[...Object.entries(LAYER_ALIAS_PATHS), ...serverAliases].map(([name, path]) => toAlias(appRoot, name, path)),
      ...readDomainDirs(appRoot).map((domain) => toAlias(appRoot, `@${domain}`, `${CORE_DIR}/${domain}`, domain))
    ]
  }
}
