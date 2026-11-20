import { toLineNumber } from './script-source.mjs'

const VALUE_ACCESS = /(?:\?\.|\.)value(?![\w$])/g

const ASSIGNMENT_OPERATOR = String.raw`(?:\*\*|<<|>>>|>>|&&|\|\||\?\?|[-+*/%&|^])?=(?![=>])`

const PROPERTY_CHAIN = String.raw`(?:\??\.[\w$]+|(?:\?\.)?\[[^\]\n]*\])`

const MUTATING_METHODS = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
  'copyWithin',
  'set',
  'add',
  'delete',
  'clear'
]

const DIRECT_WRITE = new RegExp(String.raw`^\s*(?:${ASSIGNMENT_OPERATOR}|\+\+|--)`)

const NESTED_WRITE = new RegExp(String.raw`^${PROPERTY_CHAIN}+\s*(?:${ASSIGNMENT_OPERATOR}|\+\+|--)`)

const MUTATING_CALL = new RegExp(String.raw`^${PROPERTY_CHAIN}*\.(?:${MUTATING_METHODS.join('|')})\s*\(`)

const PREFIX_UPDATE = /(?:\+\+|--|\bdelete\s+)\s*[\w$.?]*$/

const DOM_RECEIVER = /(?:\b(?:target|currentTarget|element|input)|\bas\s+HTML\w*Element\s*\))\s*$/

const PLAIN_OBJECT_RECEIVER = /\b(?:binding|rule)\s*$/

const ITERATOR_RESULT_RECEIVER = /(?:\?\.|\.)(?:keys|values|entries)\s*\(\s*\)\s*(?:\?\.|\.)next\s*\(\s*\)\s*$/

const isWrite = (before, after) =>
  DIRECT_WRITE.test(after) || NESTED_WRITE.test(after) || MUTATING_CALL.test(after) || PREFIX_UPDATE.test(before)

export const findToValueViolations = ({ file, source, script }) => {
  const violations = []
  const lines = source.split(/\r?\n/)

  for (const match of script.matchAll(VALUE_ACCESS)) {
    const start = match.index
    const end = start + match[0].length
    const lineStart = script.lastIndexOf('\n', start) + 1
    const lineEnd = script.indexOf('\n', end)
    const before = script.slice(lineStart, start)
    const after = script.slice(end, lineEnd === -1 ? undefined : lineEnd)

    if (
      DOM_RECEIVER.test(before) ||
      PLAIN_OBJECT_RECEIVER.test(before) ||
      ITERATOR_RESULT_RECEIVER.test(script.slice(0, start)) ||
      isWrite(before, after)
    ) {
      continue
    }

    const line = toLineNumber(script, start)

    violations.push({ file, line, text: (lines[line - 1] ?? '').trim() })
  }

  return violations
}
