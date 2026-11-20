import { existsSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { posix } from 'node:path'
import { DEFAULT_PACKAGE_RANK, NUXT_LAYER_ORDER, NUXT_SEGMENT_ORDER, PACKAGE_RANKS } from './ranks.mjs'

export const IMPORT_GROUPS = Object.freeze({
  BUILTIN: 0,
  EXTERNAL: 1,
  LAYER: 2,
  DOMAIN: 3,
  UNKNOWN: 4,
  RELATIVE: 5
})

const DEFAULT_DOMAIN_ROOT = 'src/core'

const SOURCE_DIR_PREFIX = /^src\//u

const DEFAULT_UNIT_DEPTH = 2

const INDEX_SUFFIX_PATTERN = /\/index(?:\.(?:vue|ts|mts|js|mjs))?$/u

const PARENT_PREFIX = '../'

const COMPONENT_ENTRY = 'index.vue'

const DEFAULT_RANK_INDEX = PACKAGE_RANKS.findIndex(({ name }) => name === DEFAULT_PACKAGE_RANK)

const BUILTIN_NAMES = new Set(builtinModules)

export const toPosixPath = (path) =>
  path.replaceAll('\\', '/').replace(/^([A-Za-z]):/u, (_match, drive) => `${drive.toLowerCase()}:`)

export const isRelativeSpecifier = (specifier) =>
  specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith(PARENT_PREFIX)

const isBuiltinSpecifier = (specifier) => specifier.startsWith('node:') || BUILTIN_NAMES.has(specifier.split('/')[0])

const matchesPackagePattern = (specifier, pattern) =>
  pattern.endsWith('*')
    ? specifier.startsWith(pattern.slice(0, -1))
    : specifier === pattern || specifier.startsWith(`${pattern}/`)

export const packageRankOf = (specifier) => {
  const index = PACKAGE_RANKS.findIndex(({ patterns }) =>
    patterns.some((pattern) => matchesPackagePattern(specifier, pattern))
  )

  return index === -1 ? DEFAULT_RANK_INDEX : index
}

const isWithin = (path, root) => path === root || path.startsWith(`${root}/`)

const lower = (value) => value.toLowerCase()

const domainOfPath = (path, prefixes) => {
  const prefix = prefixes.find((candidate) => path.startsWith(candidate))

  return prefix === undefined ? undefined : /^([^/]+)\//u.exec(path.slice(prefix.length))?.[1]
}

const domainPrefixes = (appPath, domainRoot) => {
  const inner = domainRoot.replace(SOURCE_DIR_PREFIX, '')
  const testKind = /^tests\/([^/]+)\//u.exec(appPath)?.[1]

  return {
    any: [`${domainRoot}/`, ...(testKind === undefined ? [] : [`tests/${testKind}/${inner}/`])],
    source: [`${domainRoot}/`]
  }
}

const createPathKey = (segmentOrder) => (rest) => {
  const normalized = rest
    .replace(/\/+$/u, '')
    .replace(INDEX_SUFFIX_PATTERN, '')
    .replace(/^index$/u, '')

  if (normalized === '') {
    return [0, 0, '', 0, '']
  }

  const segments = normalized.split('/')
  const segmentIndex = segmentOrder.indexOf(segments[0])
  const isKnownSegment = segmentIndex !== -1

  return [
    1,
    isKnownSegment ? segmentIndex : segmentOrder.length,
    isKnownSegment ? '' : lower(segments[0]),
    segments.length,
    lower(normalized)
  ]
}

const parentDepthOf = (specifier) => {
  let depth = 0
  let rest = specifier

  while (rest === '..' || rest.startsWith(PARENT_PREFIX)) {
    depth += 1
    rest = rest === '..' ? '' : rest.slice(PARENT_PREFIX.length)
  }

  return { depth, rest: rest.replace(/^\.\/?/u, '') }
}

export const compareKeys = (left, right) => {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const a = left[index]
    const b = right[index]

    if (a === b) {
      continue
    }

    if (typeof a === 'number' && typeof b === 'number') {
      return a - b
    }

    return String(a) < String(b) ? -1 : 1
  }

  return 0
}

export const createImportResolver = (settings, filename) => {
  const file = toPosixPath(filename)
  const appRoot = settings.appRoot === undefined ? undefined : toPosixPath(settings.appRoot)
  const domainOrder = settings.domainOrder ?? []
  const layerOrder = settings.layerOrder ?? NUXT_LAYER_ORDER
  const layerDependencyOrder = settings.layerDependencyOrder ?? []
  const pathKey = createPathKey(settings.segmentOrder ?? NUXT_SEGMENT_ORDER)

  const aliasPathKeys = new Map(
    (settings.aliases ?? [])
      .filter((alias) => alias.segmentOrder !== undefined)
      .map((alias) => [alias.name, createPathKey(alias.segmentOrder)])
  )

  const aliasPathKey = (alias, rest) => (aliasPathKeys.get(alias.name) ?? pathKey)(rest)
  const aliases = (settings.aliases ?? []).map((alias) => ({ ...alias, root: toPosixPath(alias.root) }))
  const aliasesByName = [...aliases].sort((left, right) => right.name.length - left.name.length)
  const aliasesByRoot = [...aliases].sort((left, right) => right.root.length - left.root.length)
  const appPath = appRoot !== undefined && isWithin(file, appRoot) ? posix.relative(appRoot, file) : undefined

  const prefixes =
    appPath === undefined ? undefined : domainPrefixes(appPath, settings.domainRoot ?? DEFAULT_DOMAIN_ROOT)

  const fileDomain = prefixes === undefined ? undefined : domainOfPath(appPath, prefixes.any)
  const sourceDomain = prefixes === undefined ? undefined : domainOfPath(appPath, prefixes.source)
  const fileDir = posix.dirname(file)

  const matchAlias = (specifier) => {
    const alias = aliasesByName.find(({ name }) => specifier === name || specifier.startsWith(`${name}/`))

    return alias === undefined ? undefined : { alias, rest: specifier.slice(alias.name.length + 1) }
  }

  const aliasOfPath = (path) => aliasesByRoot.find(({ root }) => isWithin(path, root))

  const resolveTarget = (specifier) => {
    if (isRelativeSpecifier(specifier)) {
      return posix.join(fileDir, specifier)
    }

    const matched = matchAlias(specifier)

    if (matched === undefined) {
      return undefined
    }

    const { alias, rest } = matched

    return posix.join(alias.root, rest === '' && alias.entry !== undefined ? alias.entry : rest)
  }

  const aliasSpecifierOf = (path) => {
    const alias = aliasOfPath(path)

    if (alias === undefined) {
      return undefined
    }

    const rest = posix.relative(alias.root, path)

    return rest === '' || rest === alias.entry ? alias.name : `${alias.name}/${rest}`
  }

  const relativeSpecifierOf = (path) => {
    const relative = posix.relative(fileDir, path)

    if (relative === '') {
      return '.'
    }

    return relative.startsWith('.') ? relative : `./${relative}`
  }

  const domainOf = (specifier) => {
    const target = resolveTarget(specifier)

    return target === undefined ? undefined : aliasOfPath(target)?.domain
  }

  const domainRankOf = (domain) => {
    if (domain === fileDomain) {
      return Number.MAX_SAFE_INTEGER
    }

    const index = domainOrder.indexOf(domain)

    return index === -1 ? domainOrder.length : index
  }

  const orderKey = (specifier, isTypeOnly) => {
    const typeFlag = isTypeOnly ? 1 : 0
    const tail = [typeFlag, specifier]

    if (isRelativeSpecifier(specifier)) {
      const { depth, rest } = parentDepthOf(specifier)
      const fileAlias = aliasOfPath(file)

      return [
        IMPORT_GROUPS.RELATIVE,
        -depth,
        '',
        ...(fileAlias === undefined ? pathKey(rest) : aliasPathKey(fileAlias, rest)),
        ...tail
      ]
    }

    const matched = matchAlias(specifier)

    if (matched !== undefined && matched.alias.domain !== undefined) {
      return [
        IMPORT_GROUPS.DOMAIN,
        domainRankOf(matched.alias.domain),
        matched.alias.domain,
        ...aliasPathKey(matched.alias, matched.rest),
        ...tail
      ]
    }

    if (matched !== undefined) {
      const layerIndex = layerOrder.indexOf(matched.alias.name)

      return [
        IMPORT_GROUPS.LAYER,
        layerIndex === -1 ? layerOrder.length : layerIndex,
        matched.alias.name,
        ...aliasPathKey(matched.alias, matched.rest),
        ...tail
      ]
    }

    if (isBuiltinSpecifier(specifier)) {
      return [IMPORT_GROUPS.BUILTIN, 0, lower(specifier), ...tail]
    }

    if (/^[~@]{1,2}(?:\/|$)/u.test(specifier)) {
      return [IMPORT_GROUPS.UNKNOWN, 0, lower(specifier), ...tail]
    }

    return [IMPORT_GROUPS.EXTERNAL, packageRankOf(specifier), lower(specifier), ...tail]
  }

  const findUnit = () => {
    const fileAlias = aliasOfPath(file)

    if (fileAlias === undefined) {
      return undefined
    }

    if (posix.basename(file) === COMPONENT_ENTRY && fileDir.startsWith(`${fileAlias.root}/`)) {
      return { alias: fileAlias, root: fileDir }
    }

    for (let directory = fileDir; directory.startsWith(`${fileAlias.root}/`); directory = posix.dirname(directory)) {
      if (existsSync(`${directory}/${COMPONENT_ENTRY}`)) {
        return { alias: fileAlias, root: directory }
      }
    }

    const segments = posix
      .relative(fileAlias.root, fileDir)
      .split('/')
      .filter((segment) => segment !== '')

    return {
      alias: fileAlias,
      root: posix.join(fileAlias.root, ...segments.slice(0, fileAlias.unitDepth ?? DEFAULT_UNIT_DEPTH))
    }
  }

  const fileLayerAlias = () => {
    const alias = aliasOfPath(file)

    return alias !== undefined && alias.domain === undefined && layerDependencyOrder.includes(alias.name)
      ? alias
      : undefined
  }

  const aliasOfSpecifier = (specifier) => {
    const target = resolveTarget(specifier)

    return target === undefined ? undefined : aliasOfPath(target)
  }

  return {
    appRoot,
    appPath,
    file,
    fileDomain,
    sourceDomain,
    domainOrder,
    layerDependencyOrder,
    fileLayerAlias,
    aliasOfSpecifier,
    matchAlias,
    aliasOfPath,
    resolveTarget,
    aliasSpecifierOf,
    relativeSpecifierOf,
    domainOf,
    orderKey,
    findUnit,
    isWithin
  }
}
