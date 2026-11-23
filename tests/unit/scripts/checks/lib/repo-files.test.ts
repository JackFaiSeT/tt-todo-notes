import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { listRepoFiles } from '../../../../../scripts/checks/lib/repo-files.mjs'
import { TEST_TEMP_ROOT } from '../../../../setup/paths'

describe('Scripts/repoFiles', () => {
  let directory: string

  beforeAll(() => {
    mkdirSync(TEST_TEMP_ROOT, { recursive: true })
    directory = mkdtempSync(join(TEST_TEMP_ROOT, 'repo-'))
    execFileSync('git', ['init', '--quiet'], { cwd: directory })
    mkdirSync(join(directory, '[sample]'))
    writeFileSync(join(directory, 'tracked.txt'), '')
    execFileSync('git', ['add', '--', 'tracked.txt'], { cwd: directory })
    writeFileSync(join(directory, '.gitignore'), 'tracked.txt\ncache.txt\n')
    writeFileSync(join(directory, '.git/info/exclude'), '/private.txt\n')

    for (const name of ['cache.txt', 'private.txt', '[sample]/новый файл.ts']) {
      writeFileSync(join(directory, name), '')
    }
  })

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it('should include tracked files and visible new files when both ignore files apply', () => {
    expect(listRepoFiles(['.'], directory)).toEqual(['.gitignore', '[sample]/новый файл.ts', 'tracked.txt'])
  })

  it('should restrict the result to literal paths when checking a directory', () => {
    expect(listRepoFiles(['[sample]'], directory)).toEqual(['[sample]/новый файл.ts'])
  })
})
