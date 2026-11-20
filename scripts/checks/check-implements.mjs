import { failCheck, passCheck } from './lib/check-output.mjs'
import { readFrontendScripts } from './lib/frontend-sources.mjs'
import { findImplementsViolations } from './lib/implements-rules.mjs'

const entries = readFrontendScripts()

const violations = entries.flatMap((entry) =>
  findImplementsViolations(entry).map(({ line, name }) => `${entry.file}:${line} ${name}`)
)

if (violations.length > 0) {
  failCheck('Classes without implements', violations, [
    'Every class implements its interface: class XxxService implements IXxxService',
    'Error subclasses (extends Error, extends XxxError) are exempt'
  ])
}

passCheck(`Classes implement interfaces: ${entries.length} files checked`)
