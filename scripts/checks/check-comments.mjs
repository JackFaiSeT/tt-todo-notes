import { readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { commentKindOf, findCommentViolations } from './lib/comment-rules.mjs'
import { listRepoFiles, ROOT } from './lib/repo-files.mjs'

const args = process.argv.slice(2).filter((arg) => arg !== '--quiet')

const roots = args.length ? args.map((path) => relative(ROOT, resolve(path)) || '.') : ['.']

const files = listRepoFiles(roots).filter((path) => path !== 'pnpm-lock.yaml' && commentKindOf(path) !== null)

for (const file of files) {
  const source = readFileSync(join(ROOT, file), 'utf8')

  for (const violation of findCommentViolations(source, file)) {
    console.error(`${file}:${violation.line}: ${violation.text}`)
    process.exitCode = 1
  }
}

if (!process.exitCode && !process.argv.includes('--quiet')) {
  console.log(`Файлов без комментариев: ${files.length}.`)
}
