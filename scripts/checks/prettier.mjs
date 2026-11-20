import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { listRepoFiles } from './lib/repo-files.mjs'

const cli = fileURLToPath(import.meta.resolve('prettier/bin/prettier.cjs'))

const options = [cli, ...process.argv.slice(2), '--ignore-unknown', '--']

const maxPathCharacters = 16_000

const format = (files) => {
  const result = spawnSync(process.execPath, [...options, ...files], { stdio: 'inherit' })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1
  }
}

let batch = []

let length = 0

for (const file of listRepoFiles()) {
  if (length + file.length > maxPathCharacters) {
    format(batch)
    batch = []
    length = 0
  }

  batch.push(file)
  length += file.length + 3
}

if (batch.length) {
  format(batch)
}
