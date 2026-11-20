import { domainOrderRule } from './rules/domain-order.mjs'
import { importLocalityRule } from './rules/import-locality.mjs'
import { importOrderRule } from './rules/import-order.mjs'

export const importsPlugin = {
  meta: { name: 'notes-imports' },
  rules: {
    'import-order': importOrderRule,
    'import-locality': importLocalityRule,
    'domain-order': domainOrderRule
  }
}
