import { spawnSync } from 'node:child_process'
import { argv, cwd, exit } from 'node:process'
import { REPO_CHECKS } from './lib/repo-checks.mjs'

const checks = argv.includes('--all')
  ? ['lint:js', 'lint:style', 'lint:prettier', 'lint:repo']
  : argv.includes('--fix')
    ? ['lint:js --fix', 'lint:style --fix', 'format']
    : REPO_CHECKS

const CHECK_COLUMN_WIDTH = Math.max(...checks.map((check) => check.length))

const runCheck = (check) => {
  console.log(`\n> pnpm run ${check}`)

  const startedAt = performance.now()
  const result = spawnSync(`pnpm run --silent ${check}`, { cwd: cwd(), stdio: 'inherit', shell: true })
  const seconds = ((performance.now() - startedAt) / 1000).toFixed(1)

  return { check, isOk: result.status === 0, seconds }
}

const results = checks.map(runCheck)

const failures = results.filter((result) => !result.isOk)

console.log(`\n| ${'check'.padEnd(CHECK_COLUMN_WIDTH)} | ok/FAIL | time   |`)

console.log(`| ${'-'.repeat(CHECK_COLUMN_WIDTH)} | ------- | ------ |`)

for (const { check, isOk, seconds } of results) {
  console.log(
    `| ${check.padEnd(CHECK_COLUMN_WIDTH)} | ${(isOk ? 'ok' : 'FAIL').padEnd(7)} | ${`${seconds}s`.padEnd(6)} |`
  )
}

if (failures.length > 0) {
  console.error(
    `\n${failures.length} of ${results.length} checks failed: ${failures.map(({ check }) => check).join(', ')}`
  )

  exit(1)
}

console.log(`\nAll ${results.length} checks passed`)
