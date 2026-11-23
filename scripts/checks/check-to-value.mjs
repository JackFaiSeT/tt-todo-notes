import { failCheck, passCheck } from './lib/check-output.mjs'
import { readFrontendScripts } from './lib/frontend-sources.mjs'
import { findToValueViolations } from './lib/to-value-rules.mjs'

const entries = readFrontendScripts()

const violations = entries.flatMap((entry) =>
  findToValueViolations(entry).map(({ line, text }) => `${entry.file}:${line} ${text}`)
)

if (violations.length > 0) {
  failCheck('Ref reads through .value', violations, [
    'Read refs with toValue(x); .value is only for writes: x.value = …, x.value++, x.value.push(…)',
    'Allowed non-ref reads: target.value, element.value, input.value, (… as HTMLxxxElement).value, binding.value, rule.value, keys()/values()/entries().next().value'
  ])
}

passCheck(`Ref reads use toValue: ${entries.length} files checked`)
