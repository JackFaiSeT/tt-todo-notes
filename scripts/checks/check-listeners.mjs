import { failCheck, passCheck } from './lib/check-output.mjs'
import { readFrontendScripts } from './lib/frontend-sources.mjs'
import { findListenerViolations } from './lib/listener-rules.mjs'

const entries = readFrontendScripts()

const violations = entries.flatMap((entry) => {
  const { leaks, activeListeners } = findListenerViolations(entry.source, entry.file)
  const location = entry.file

  return [
    ...leaks.map(({ label, acquired, released }) => `${location} ${label}: ${acquired} acquired, ${released} released`),
    ...activeListeners.map(({ line, event }) => `${location}:${line} ${event} listener without { passive: true }`)
  ]
})

if (violations.length > 0) {
  failCheck('Unreleased resources and active scroll listeners', violations, [
    'Every addEventListener needs removeEventListener (or { once: true }), every observer disconnect, every interval clearInterval, every animation frame cancelAnimationFrame',
    'Scroll, wheel and touch listeners take { passive: true }'
  ])
}

passCheck(`Listeners balanced: ${entries.length} files checked`)
