export type LintJsPart = {
  readonly name: string
  readonly targets: readonly string[]
  readonly ignores: readonly string[]
  readonly config?: string
}

export const LINT_JS_PARTS: readonly LintJsPart[]

export const eslintArgsOf: (part: LintJsPart, extraArgs?: readonly string[]) => string[]
