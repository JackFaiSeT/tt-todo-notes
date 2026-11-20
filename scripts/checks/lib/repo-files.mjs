import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../../lib/files.mjs'

export { ROOT }

export const listRepoFiles = (roots = ['.'], directory = ROOT) => {
  const output = execFileSync(
    'git',
    ['--literal-pathspecs', 'ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...roots],
    { cwd: directory, encoding: 'utf8' }
  )

  return output
    .split('\0')
    .filter((file) => file && statSync(join(directory, file), { throwIfNoEntry: false })?.isFile())
    .sort()
}
