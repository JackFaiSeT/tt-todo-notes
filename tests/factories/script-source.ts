import { toScriptEntry } from '../../scripts/checks/lib/script-source.mjs'

export type ScriptEntry = {
  file: string
  source: string
  script: string
}

export const toSource = (...lines: string[]): string => lines.join('\n')

export const toEntry = (source: string, file = 'src/shared/utils/sample.ts'): ScriptEntry => toScriptEntry(file, source)

export const buildVueSource = (script: string, template = '<div>{{ label }}</div>'): string =>
  toSource('<script setup lang="ts">', script, '</script>', '', '<template>', `  ${template}`, '</template>')
