import { maskStrings, readScript, toLineNumber } from './script-source.mjs'

const REACTIVE_FACTORIES = ['ref', 'shallowRef', 'computed', 'reactive', 'shallowReactive']

const OBJECT_FACTORIES = ['reactive', 'shallowReactive']

const FACTORY_CALL = new RegExp(String.raw`(?<![\w$.])(${REACTIVE_FACTORIES.join('|')})\s*\(`, 'g')

const OBJECT_FACTORY_GENERIC = new RegExp(String.raw`(?<![\w$.])(${OBJECT_FACTORIES.join('|')})\s*<`, 'g')

const OBJECT_FACTORY_CALL = new RegExp(String.raw`(?<![\w$.])(${OBJECT_FACTORIES.join('|')})\s*\(`, 'g')

const CAST_AFTER_CALL = /^\s*(?:as|satisfies)\b/

const ANNOTATED_DECLARATION = new RegExp(
  String.raw`\b(?:const|let)\s+[\w$]+\s*:\s*[^=]+=\s*(?:${REACTIVE_FACTORIES.join('|')})\s*\(`
)

const IMPORT_LINE = /^\s*(?:import|export)\b.*\bfrom\b/

const findClosingParenthesis = (script, openIndex) => {
  let depth = 0

  for (let index = openIndex; index < script.length; index += 1) {
    if (script[index] === '(') {
      depth += 1
    } else if (script[index] === ')') {
      depth -= 1

      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

const findUntypedCalls = (script, file, lines) => {
  const violations = []

  script.split('\n').forEach((line, index) => {
    if (IMPORT_LINE.test(line) || ANNOTATED_DECLARATION.test(line)) {
      return
    }

    for (const match of line.matchAll(FACTORY_CALL)) {
      violations.push({ file, line: index + 1, kind: `untyped ${match[1]}`, text: (lines[index] ?? '').trim() })
    }
  })

  return violations
}

const findObjectFactoryTyping = (script, file, lines) => {
  const violations = []

  const pushViolation = (offset, kind) => {
    const line = toLineNumber(script, offset)

    violations.push({ file, line, kind, text: (lines[line - 1] ?? '').trim() })
  }

  for (const match of script.matchAll(OBJECT_FACTORY_GENERIC)) {
    pushViolation(match.index, `${match[1]}<T> generic`)
  }

  for (const match of script.matchAll(OBJECT_FACTORY_CALL)) {
    const closingIndex = findClosingParenthesis(script, match.index + match[0].length - 1)

    if (closingIndex !== -1 && CAST_AFTER_CALL.test(script.slice(closingIndex + 1))) {
      pushViolation(match.index, `${match[1]}(…) cast`)
    }
  }

  return violations
}

export const findReactivityViolations = (source, file) => {
  const script = maskStrings(readScript(source, file)).replace(/\r/g, '')
  const lines = source.split(/\r?\n/)

  return [...findUntypedCalls(script, file, lines), ...findObjectFactoryTyping(script, file, lines)]
}
