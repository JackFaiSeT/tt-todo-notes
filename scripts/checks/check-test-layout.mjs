import { failCheck, passCheck } from './lib/check-output.mjs'
import { listRepoFiles } from './lib/repo-files.mjs'
import { findTestLayoutViolations } from './lib/test-layout-rules.mjs'

const files = listRepoFiles(['.'])

const violations = findTestLayoutViolations(files)

if (violations.length > 0) {
  failCheck(
    'Tests breaking the layout',
    violations.map(({ path, reason }) => `${path}: ${reason}`),
    [
      'Tests live in tests/ of their application or package and repeat the source tree (scripts/checks/lib/test-layout-rules.mjs)'
    ]
  )
}

passCheck(`Test layout: ${files.filter((path) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(path)).length} test files checked`)
