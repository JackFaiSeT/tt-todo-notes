import { posix } from 'node:path'
import ts from 'typescript'
import { LAYER_ALIAS_PATHS } from '../../../config/nuxt/app.mjs'

const LAYER_RANKS = { contract: -1, base: 0, uikit: 1, shared: 2, core: 3, app: 4 }

export const CORE_ROOT = 'src/core'

const APP_ROOT = 'src/app/'

const SERVER_ROOT = 'src/server/'

const PATH_LAYERS = [
  { prefix: 'src/shared/contract/', layer: 'contract' },
  { prefix: 'src/shared/components/base/', layer: 'base' },
  { prefix: 'src/shared/uikit/', layer: 'uikit' },
  { prefix: 'src/shared/', layer: 'shared' },
  { prefix: 'src/core/', layer: 'core' },
  { prefix: APP_ROOT, layer: 'app' },
  { prefix: SERVER_ROOT, layer: 'server' }
]

export const APP_DOMAIN_ENTRIES = ['', 'index', 'components', 'components/index']

export const COMPOSITION_ENTRY = 'composition'

export const COMPOSITION_ROOT = 'src/app/plugins/services.ts'

const FRAMEWORK_PACKAGES = ['vue', 'pinia', '#imports', '#app', 'nuxt/app']

const DATA_PACKAGES = ['drizzle-orm', 'better-sqlite3']

const DATA_TARGETS = ['src/server/database/connection', 'src/server/database/schema']

const DATA_OWNERS = [
  /^src\/server\/modules\/[^/]+\/repositories\//u,
  /^src\/server\/modules\/[^/]+\/[^/]+\.module\.ts$/u,
  /^src\/server\/database\//u,
  /^src\/server\/plugins\//u
]

const HTTP_FREE_SERVER_FILE = /^src\/server\/modules\/[^/]+\/(?:services|dto)\//u

const HTTP_PACKAGES = ['h3']

const PURE_DOMAIN_FILE = /^src\/core\/[^/]+\/(?:(?:api|adapter|service)(?:\.ts$|\/)|domain\/)/u

const STATE_TARGET = /(?:^|\/)(?:stores|composables)(?:\/|$)/u

const SERVER_MODULE_ENTRY = /^src\/server\/modules\/[^/]+(?:\/index(?:\.ts)?)?\/?$/u

const DOMAIN_ENTRY_FILE = /^src\/core\/([^/]+)\/(?:domain\/)?index\.ts$/

const VUE_FILE = /\.vue$/

const readEntryDomain = (repoPath) => DOMAIN_ENTRY_FILE.exec(repoPath)?.[1]

const isComponentTarget = (target, domain) =>
  VUE_FILE.test(target) || target.replace(/\/(?:index(?:\.ts)?)?$/u, '') === `${CORE_ROOT}/${domain}/components`

const resolveLayer = (repoPath) => PATH_LAYERS.find(({ prefix }) => repoPath.startsWith(prefix))?.layer

const readDomain = (repoPath) => {
  const match = /^src\/core\/([^/]+)(\/|$)/.exec(repoPath)

  return match === null ? undefined : match[1]
}

const isDomainEntry = (target, domain) => {
  const rest = target.slice(`${CORE_ROOT}/${domain}`.length)

  return [
    '',
    '/',
    '/index',
    '/index.ts',
    '/domain',
    '/domain/',
    '/domain/index',
    '/domain/index.ts',
    '/utils',
    '/utils/',
    '/utils/index',
    '/utils/index.ts'
  ].includes(rest)
}

const readDomainPath = (target, domain) =>
  target
    .slice(`${CORE_ROOT}/${domain}`.length)
    .replace(/^\/|\/$/gu, '')
    .replace(/\.ts$/u, '')

const isForbiddenForApp = (file, target, domain) => {
  const domainPath = readDomainPath(target, domain)

  return !APP_DOMAIN_ENTRIES.includes(domainPath) && !(domainPath === COMPOSITION_ENTRY && file === COMPOSITION_ROOT)
}

const isPackage = (specifier, packages) =>
  packages.some((name) => specifier === name || specifier.startsWith(`${name}/`))

const isWithin = (target, directory) => target === directory || target.startsWith(`${directory}/`)

const isDataAccess = (specifier, target) =>
  isPackage(specifier, DATA_PACKAGES) || (target !== undefined && DATA_TARGETS.includes(target.replace(/\.ts$/u, '')))

const violatesDataOwnership = (file, specifier, target) =>
  !DATA_OWNERS.some((owner) => owner.test(file)) && isDataAccess(specifier, target)

const isForbiddenDependency = ({ file, fileLayer, specifier, target, targetLayer }) => {
  if (fileLayer === 'contract') {
    return targetLayer !== 'contract'
  }

  if (PURE_DOMAIN_FILE.test(file)) {
    return isPackage(specifier, FRAMEWORK_PACKAGES) || (target !== undefined && STATE_TARGET.test(target))
  }

  return HTTP_FREE_SERVER_FILE.test(file) && isPackage(specifier, HTTP_PACKAGES)
}

const readImports = (source) => ts.preProcessFile(source, true, true).importedFiles.map(({ fileName }) => fileName)

const createAliasRoots = (domains) => ({
  '#server': 'src/server',
  '~': 'src',
  '@': 'src',
  '~~': '.',
  '@@': '.',
  ...LAYER_ALIAS_PATHS,
  ...Object.fromEntries(domains.map((domain) => [`@${domain}`, `${CORE_ROOT}/${domain}`]))
})

const isReversedDomainOrder = (domainOrder, fileDomain, targetDomain) => {
  const fileIndex = domainOrder.indexOf(fileDomain)

  return fileIndex !== -1 && domainOrder.indexOf(targetDomain) > fileIndex
}

export const findDomainOrderGaps = (domains, domainOrder) => ({
  missing: domains.filter((domain) => !domainOrder.includes(domain)),
  unknown: domainOrder.filter((domain) => !domains.includes(domain))
})

const violatesServerBoundary = (file, target, targetLayer) => {
  if (!file.startsWith(SERVER_ROOT)) {
    return targetLayer === 'server'
  }

  if (targetLayer !== 'server') {
    return target.startsWith('src/') && targetLayer !== 'contract'
  }

  if (file.startsWith('src/server/common/') || file.startsWith('src/server/database/')) {
    return isWithin(target, 'src/server/modules')
  }

  if (file.startsWith('src/server/modules/')) {
    return isWithin(target, 'src/server/api') || isWithin(target, 'src/server/plugins')
  }

  if (file.startsWith('src/server/plugins/')) {
    return isWithin(target, 'src/server/modules') && !SERVER_MODULE_ENTRY.test(target)
  }

  return (
    file.startsWith('src/server/api/') &&
    !target.startsWith('src/server/common/') &&
    !target.startsWith('src/server/api/') &&
    !SERVER_MODULE_ENTRY.test(target)
  )
}

export const createLayerRules = (domains, domainOrder = []) => {
  const aliasRoots = createAliasRoots(domains)
  const aliases = Object.keys(aliasRoots).sort((left, right) => right.length - left.length)

  const resolveTarget = (specifier, repoPath) => {
    if (specifier.startsWith('.')) {
      return posix.normalize(posix.join(posix.dirname(repoPath), specifier))
    }

    const alias = aliases.find((key) => specifier === key || specifier.startsWith(`${key}/`))

    return alias === undefined ? undefined : posix.join(aliasRoots[alias], specifier.slice(alias.length))
  }

  const isLayeredFile = (repoPath) => resolveLayer(repoPath) !== undefined

  const findImportViolations = (repoPath, source) => {
    const violations = {
      placement: [],
      layer: [],
      domain: [],
      order: [],
      app: [],
      server: [],
      data: [],
      barrel: [],
      forbidden: []
    }

    const fileLayer = resolveLayer(repoPath)

    if (fileLayer === undefined) {
      return violations
    }

    const fileDomain = readDomain(repoPath)
    const entryDomain = readEntryDomain(repoPath)

    if (repoPath.startsWith('src/shared/') && domains.includes(repoPath.split('/')[2])) {
      violations.placement.push({ file: repoPath })
    }

    for (const specifier of readImports(source)) {
      const target = resolveTarget(specifier, repoPath)
      const targetLayer = target === undefined ? undefined : resolveLayer(`${target}/`)

      if (isForbiddenDependency({ file: repoPath, fileLayer, specifier, target, targetLayer })) {
        violations.forbidden.push({ file: repoPath, specifier })
        continue
      }

      if (target !== undefined && violatesServerBoundary(repoPath, target, targetLayer)) {
        violations.server.push({ file: repoPath, specifier })
        continue
      }

      if (violatesDataOwnership(repoPath, specifier, target)) {
        violations.data.push({ file: repoPath, specifier })
        continue
      }

      if (target === undefined) {
        continue
      }

      if (fileLayer === 'server') {
        continue
      }

      if (entryDomain !== undefined && isComponentTarget(target, entryDomain)) {
        violations.barrel.push({ file: repoPath, specifier })
      }

      if (targetLayer !== undefined && LAYER_RANKS[targetLayer] > LAYER_RANKS[fileLayer]) {
        violations.layer.push({ file: repoPath, fileLayer, specifier, targetLayer })
      }

      const targetDomain = readDomain(target)

      if (
        fileDomain !== undefined &&
        targetDomain !== undefined &&
        targetDomain !== fileDomain &&
        !isDomainEntry(target, targetDomain)
      ) {
        violations.domain.push({ file: repoPath, specifier, targetDomain })
      }

      if (
        fileDomain !== undefined &&
        targetDomain !== undefined &&
        targetDomain !== fileDomain &&
        isReversedDomainOrder(domainOrder, fileDomain, targetDomain)
      ) {
        violations.order.push({ file: repoPath, specifier, fileDomain, targetDomain })
      }

      if (targetDomain !== undefined && fileLayer === 'app' && isForbiddenForApp(repoPath, target, targetDomain)) {
        violations.app.push({ file: repoPath, specifier })
      }
    }

    return violations
  }

  return { isLayeredFile, findImportViolations, resolveTarget }
}
