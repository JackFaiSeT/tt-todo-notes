import { posix } from 'node:path'
import { createImportResolver, isRelativeSpecifier } from '../resolver.mjs'
import { SETTINGS_SCHEMA } from '../settings-schema.mjs'

const isStringLiteral = (node) => node?.type === 'Literal' && typeof node.value === 'string'

export const importLocalityRule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: { description: 'Relative paths stay inside the module, everything else goes through an alias' },
    schema: [SETTINGS_SCHEMA],
    messages: {
      relativeOutside: "Путь '{{source}}' выходит за границу модуля {{unit}}: импортируйте через алиас '{{fixed}}'",
      relativeWithoutAlias:
        "Путь '{{source}}' выходит за границу модуля {{unit}}, а у цели нет алиаса: перенесите модуль в слой с алиасом",
      aliasInside: "'{{source}}' лежит в том же модуле {{unit}}: импортируйте относительным путём '{{fixed}}'"
    }
  },
  create: (context) => {
    const resolver = createImportResolver(context.options[0] ?? {}, context.filename)

    if (resolver.appPath === undefined) {
      return {}
    }

    const unit = resolver.findUnit()
    const unitLabel = unit === undefined ? resolver.appPath : posix.relative(resolver.appRoot, unit.root) || '.'

    const isInsideUnit = (target) =>
      unit !== undefined && resolver.isWithin(target, unit.root) && resolver.aliasOfPath(target) === unit.alias

    const report = (source, messageId, fixed) =>
      context.report({
        node: source,
        messageId,
        data: { source: source.value, unit: unitLabel, fixed },
        fix:
          fixed === undefined
            ? undefined
            : (fixer) => fixer.replaceText(source, `${source.raw[0]}${fixed}${source.raw[0]}`)
      })

    const checkRelative = (source) => {
      const target = resolver.resolveTarget(source.value)

      if (isInsideUnit(target)) {
        return
      }

      const aliased = resolver.aliasSpecifierOf(target)

      if (aliased !== undefined) {
        report(source, 'relativeOutside', aliased)
      } else if (unit !== undefined) {
        report(source, 'relativeWithoutAlias')
      }
    }

    const checkAliased = (source) => {
      const target = resolver.resolveTarget(source.value)

      if (target !== undefined && isInsideUnit(target)) {
        report(source, 'aliasInside', resolver.relativeSpecifierOf(target))
      }
    }

    const check = (source) => {
      if (!isStringLiteral(source)) {
        return
      }

      if (isRelativeSpecifier(source.value)) {
        checkRelative(source)
      } else {
        checkAliased(source)
      }
    }

    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => check(node.source)
    }
  }
}
