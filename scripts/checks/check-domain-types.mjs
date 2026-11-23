import { failCheck, passCheck } from './lib/check-output.mjs'
import { findDomainTypeViolations, isDomainFile } from './lib/domain-types-rules.mjs'
import { readFrontendScripts } from './lib/frontend-sources.mjs'

const entries = readFrontendScripts().filter(({ file }) => isDomainFile(file))

const violations = entries
  .flatMap((entry) =>
    findDomainTypeViolations(entry.file, entry.source).map(({ line, message }) => `${entry.file}:${line} ${message}`)
  )
  .sort()

if (violations.length > 0) {
  failCheck('Runtime code or loose types in domain/', violations, [
    'domain/index.ts declares only export namespace N<Domain> with types; data-contracts.ts — export namespace N<Domain>DataContracts',
    'Functions go to utils/, constants to constants/, form schemas to utils/schemas.ts; types go into the namespace'
  ])
}

passCheck(`domain/ holds only type namespaces: ${entries.length} files checked`)
