import { toLineNumber } from './script-source.mjs'

const CLASS_DECLARATION =
  /\bclass\s+([A-Za-z_$][\w$]*)\s*(?:<[^{]*?>\s*)?(?:extends\s+([\w$.]+)\s*(?:<[^{]*?>\s*)?)?(implements\b[^{]*)?\{/g

const ERROR_BASE = /(?:^|\.)\w*Error$/

export const findImplementsViolations = ({ file, script }) => {
  const violations = []

  for (const match of script.matchAll(CLASS_DECLARATION)) {
    const [, name, base, implementsClause] = match

    if (implementsClause !== undefined || (base !== undefined && ERROR_BASE.test(base))) {
      continue
    }

    violations.push({ file, line: toLineNumber(script, match.index), name })
  }

  return violations
}
