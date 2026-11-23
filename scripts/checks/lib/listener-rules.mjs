import { readScript } from './script-source.mjs'

const RESOURCE_PAIRS = [
  { label: 'event listener', acquire: /\.addEventListener\s*\(/g, release: /\.removeEventListener\s*\(/g },
  { label: 'observer', acquire: /\bnew\s+\w*Observer\s*\(/g, release: /\.disconnect\s*\(/g },
  { label: 'interval', acquire: /(?<![\w$.])(?:window\.)?setInterval\s*\(/g, release: /\bclearInterval\s*\(/g },
  {
    label: 'animation frame',
    acquire: /(?<![\w$.])(?:window\.)?requestAnimationFrame\s*\(/g,
    release: /\bcancelAnimationFrame\s*\(/g
  }
]

const PASSIVE_EVENTS = ['scroll', 'wheel', 'touchstart', 'touchmove', 'touchend', 'touchcancel']

const ADD_LISTENER = /\.addEventListener\s*\(/g

const readCallArguments = (source, openIndex) => {
  let depth = 0

  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index]

    if (character === '(') {
      depth += 1
    } else if (character === ')') {
      depth -= 1

      if (depth === 0) {
        return source.slice(openIndex + 1, index)
      }
    }
  }

  return source.slice(openIndex + 1)
}

const lineOf = (source, index) => source.slice(0, index).split('\n').length

const collectListenerCalls = (script) =>
  [...script.matchAll(ADD_LISTENER)].map((match) => {
    const openIndex = match.index + match[0].length - 1
    const callArguments = readCallArguments(script, openIndex)

    return { line: lineOf(script, match.index), callArguments }
  })

const isSelfRemoving = (callArguments) => /\bonce\s*:\s*true\b/.test(callArguments)

const readEventName = (callArguments) => /^\s*['"`]([\w-]+)['"`]/.exec(callArguments)?.[1]

const isPassive = (callArguments) => /\bpassive\s*:\s*true\b/.test(callArguments)

const countMatches = (script, pattern) => [...script.matchAll(pattern)].length

export const findListenerViolations = (source, file) => {
  const script = readScript(source, file)
  const listenerCalls = collectListenerCalls(script)
  const selfRemoving = listenerCalls.filter(({ callArguments }) => isSelfRemoving(callArguments)).length
  const leaks = []

  for (const pair of RESOURCE_PAIRS) {
    const acquired = countMatches(script, pair.acquire) - (pair.label === 'event listener' ? selfRemoving : 0)
    const released = countMatches(script, pair.release)

    if (acquired > released) {
      leaks.push({ file, label: pair.label, acquired, released })
    }
  }

  const activeListeners = listenerCalls
    .filter(({ callArguments }) => PASSIVE_EVENTS.includes(readEventName(callArguments) ?? ''))
    .filter(({ callArguments }) => !isPassive(callArguments))
    .map(({ line, callArguments }) => ({ file, line, event: readEventName(callArguments) }))

  return { leaks, activeListeners }
}
