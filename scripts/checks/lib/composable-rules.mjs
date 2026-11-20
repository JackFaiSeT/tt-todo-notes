const COMPOSABLE_FILE = /\/composables\/(?:.+\/)?(use\w+)\.ts$/

const EXPORTED_COMPOSABLE = /^export\s+(?:const|(?:async\s+)?function)\s+(use\w+)/gm

const EXPORTED_VALUE = /^export\s+(?:default\b|(?:const|let|var|class|enum|(?:async\s+)?function\*?)\s+([\w$]+))/gm

const EXPORTED_LIST = /^export\s+\{([^}]*)\}/gm

export const isComposableFile = (file) => COMPOSABLE_FILE.test(file)

const toExportedComposables = (script) => [...script.matchAll(EXPORTED_COMPOSABLE)].map(([, name]) => name)

const toListedValueNames = (list) =>
  list
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry && !entry.startsWith('type '))
    .map((entry) => entry.split(/\s+as\s+/).at(-1))

const toExportedValues = (script) => [
  ...[...script.matchAll(EXPORTED_VALUE)].map(([, name]) => name ?? 'default'),
  ...[...script.matchAll(EXPORTED_LIST)].flatMap(([, list]) => toListedValueNames(list))
]

const toContextProviderName = (composableName) => composableName.replace(/^use/, 'provide')

export const checkSingleComposable = ({ file, script }) => {
  const [, fileName] = file.match(COMPOSABLE_FILE)
  const exported = toExportedComposables(script)

  if (exported.length === 1 && exported[0] === fileName) {
    return []
  }

  return [`${file}: exports [${exported.join(', ')}], expected only ${fileName}`]
}

export const checkValueExports = ({ file, script }) => {
  const [, fileName] = file.match(COMPOSABLE_FILE)
  const allowed = new Set([fileName, toContextProviderName(fileName)])
  const extra = toExportedValues(script).filter((name) => !allowed.has(name))

  if (extra.length === 0) {
    return []
  }

  return [
    `${file}: exports values [${extra.join(', ')}] besides ${fileName}; move pure functions to utils/ and constants to constants/`
  ]
}

export const findComposableViolations = (entry) => [...checkSingleComposable(entry), ...checkValueExports(entry)]
