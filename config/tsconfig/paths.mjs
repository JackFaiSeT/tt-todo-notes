import { readFileSync } from 'node:fs'
import { dirname, posix, resolve, sep } from 'node:path'

const WILDCARD_SUFFIX = '/*'

const ALIAS_NAME = /^[@#][a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/u

const toAliasName = (pattern) => {
  if (!ALIAS_NAME.test(pattern)) {
    throw new TypeError(`tsconfig path alias "${pattern}" must be an @ or # alias with literal path segments`)
  }

  return pattern
}

export const readTsconfigPaths = (tsconfigFile) => {
  const { compilerOptions = {} } = JSON.parse(readFileSync(tsconfigFile, 'utf8'))
  const baseDir = dirname(tsconfigFile)

  return Object.entries(compilerOptions.paths ?? {}).map(([pattern, [target]]) => {
    const isWildcard = pattern.endsWith(WILDCARD_SUFFIX)

    return {
      name: toAliasName(isWildcard ? pattern.slice(0, -WILDCARD_SUFFIX.length) : pattern),
      isWildcard,
      target: resolve(baseDir, isWildcard ? target.slice(0, -WILDCARD_SUFFIX.length) : target).replaceAll(
        sep,
        posix.sep
      )
    }
  })
}

export const tsconfigPathAliases = (tsconfigFile) =>
  readTsconfigPaths(tsconfigFile).map(({ name, isWildcard, target }) =>
    isWildcard
      ? { find: new RegExp(`^${name}/(.*)$`, 'u'), replacement: `${target}/$1` }
      : { find: new RegExp(`^${name}$`, 'u'), replacement: target }
  )
