import { describe, expect, it } from 'vitest'
import { eslintArgsOf, LINT_JS_PARTS } from '../../../../../scripts/checks/lib/lint-js-rules.mjs'

const partNamed = (name: string) => {
  const part = LINT_JS_PARTS.find((candidate) => candidate.name === name)

  if (part === undefined) {
    throw new Error(`no lint:js part ${name}`)
  }

  return part
}

describe('Scripts/lintJsRules', () => {
  it('should use zero warnings and an isolated cache when linting an app', () => {
    expect(eslintArgsOf(partNamed('server'))).toEqual([
      'src/server',
      '--max-warnings',
      '0',
      '--cache',
      '--cache-location',
      '.dev-artifacts/cache/eslint/server/'
    ])
  })

  it('should exclude app files when linting the rest of the repository', () => {
    expect(eslintArgsOf(partNamed('rest'))).toEqual([
      '.',
      '--max-warnings',
      '0',
      '--cache',
      '--cache-location',
      '.dev-artifacts/cache/eslint/rest/',
      '--ignore-pattern',
      'src/server/**'
    ])
  })

  it('should forward arguments to every part when lint receives additional flags', () => {
    expect(LINT_JS_PARTS.map((part) => eslintArgsOf(part, ['--fix']).at(-1))).toEqual(LINT_JS_PARTS.map(() => '--fix'))
  })
})
