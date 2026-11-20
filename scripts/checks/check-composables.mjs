import { failCheck, passCheck } from './lib/check-output.mjs'
import { findComposableViolations, isComposableFile } from './lib/composable-rules.mjs'
import { readFrontendScripts } from './lib/frontend-sources.mjs'

const entries = readFrontendScripts().filter(({ file }) => isComposableFile(file))

const violations = entries.flatMap(findComposableViolations)

if (violations.length > 0) {
  failCheck('Composable layout violations', violations, [
    'One composable per file named after it and no other value exports except its provide<Name> pair; types are allowed'
  ])
}

passCheck(`Composables follow the layout: ${entries.length} files checked`)
