import { declarationPaddingRule } from './rules/declaration-padding.mjs'
import { multilineTypeLiteralRule } from './rules/multiline-type-literal.mjs'
import { namedTypeArgumentRule } from './rules/named-type-argument.mjs'
import { noObjectMethodRule } from './rules/no-object-method.mjs'
import { typeMemberStyleRule } from './rules/type-member-style.mjs'

export const stylePlugin = {
  meta: { name: 'notes-style' },
  rules: {
    'declaration-padding': declarationPaddingRule,
    'multiline-type-literal': multilineTypeLiteralRule,
    'named-type-argument': namedTypeArgumentRule,
    'no-object-method': noObjectMethodRule,
    'type-member-style': typeMemberStyleRule
  }
}
