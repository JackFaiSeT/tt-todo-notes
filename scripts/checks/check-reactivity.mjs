import { failCheck, passCheck } from './lib/check-output.mjs'
import { readFrontendScripts } from './lib/frontend-sources.mjs'
import { findReactivityViolations } from './lib/reactivity-rules.mjs'

const entries = readFrontendScripts()

const violations = entries.flatMap((entry) =>
  findReactivityViolations(entry.source, entry.file).map(
    ({ line, kind, text }) => `${entry.file}:${line} [${kind}] ${text}`
  )
)

if (violations.length > 0) {
  failCheck('Untyped reactivity', violations, [
    'Give the factory an explicit type: shallowRef<boolean>(false), computed<number>(() => …)',
    'reactive is typed through the variable, without generic or cast: const state: State = reactive({ … })'
  ])
}

passCheck(`Reactivity typed: ${entries.length} files checked`)
