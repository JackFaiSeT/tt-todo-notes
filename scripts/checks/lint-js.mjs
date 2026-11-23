import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { argv, cwd, execPath, exit } from 'node:process'
import { eslintArgsOf, LINT_JS_PARTS } from './lib/lint-js-rules.mjs'

const require = createRequire(import.meta.url)

const ESLINT_PACKAGE = require.resolve('eslint/package.json')

const ESLINT_BIN = join(dirname(ESLINT_PACKAGE), JSON.parse(readFileSync(ESLINT_PACKAGE, 'utf8')).bin.eslint)

const extraArgs = argv.slice(2)

const runPart = (part) => {
  const args = eslintArgsOf(part, extraArgs)

  console.log(`\n> eslint ${args.join(' ')}`)

  const startedAt = performance.now()

  const result = spawnSync(execPath, ['--max-old-space-size=1536', ESLINT_BIN, ...args], {
    cwd: cwd(),
    stdio: 'inherit'
  })

  const seconds = ((performance.now() - startedAt) / 1000).toFixed(1)

  return {
    name: part.name,
    isOk: result.status === 0,
    seconds,
    failure: result.error?.message ?? (result.signal ? `signal ${result.signal}` : `exit ${result.status}`)
  }
}

const NAME_WIDTH = Math.max(...LINT_JS_PARTS.map(({ name }) => name.length))

const results = LINT_JS_PARTS.map(runPart)

const failures = results.filter((result) => !result.isOk)

for (const { name, isOk, seconds } of results) {
  console.log(`eslint ${name.padEnd(NAME_WIDTH)} ${isOk ? 'ok  ' : 'FAIL'} ${seconds}s`)
}

if (failures.length > 0) {
  for (const { name, failure } of failures) {
    console.error(`eslint ${name}: ${failure}`)
  }

  console.error(`\neslint failed in ${failures.map(({ name }) => name).join(', ')}`)

  exit(1)
}
