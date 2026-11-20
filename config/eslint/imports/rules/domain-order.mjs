import { createImportResolver } from '../resolver.mjs'
import { SETTINGS_SCHEMA } from '../settings-schema.mjs'

const DEFAULT_ORDER_FILE = 'config/domain-order.mjs'

const isStringLiteral = (node) => node?.type === 'Literal' && typeof node.value === 'string'

export const domainOrderRule = {
  meta: {
    type: 'problem',
    docs: { description: 'A general domain, module or layer does not depend on a more specific one' },
    schema: [SETTINGS_SCHEMA],
    messages: {
      reversed:
        '{{domain}} общее, чем {{target}}, и не зависит от него: порядок от общих к частным — {{file}}. Общее переносится ниже, частное подключается через порт или передаётся сверху',
      layerReversed:
        'Слой {{layer}} общее, чем {{target}}, и не зависит от него: порядок слоёв — {{order}}. Код, нужный одному модулю, лежит у владельца'
    }
  },
  create: (context) => {
    const settings = context.options[0] ?? {}
    const resolver = createImportResolver(settings, context.filename)
    const file = settings.domainOrderFile ?? DEFAULT_ORDER_FILE
    const domain = resolver.sourceDomain
    const domainIndex = resolver.domainOrder.indexOf(domain)
    const layer = resolver.fileLayerAlias()

    if (domainIndex === -1 && layer === undefined) {
      return {}
    }

    const layerIndex = layer === undefined ? -1 : resolver.layerDependencyOrder.indexOf(layer.name)

    const checkDomain = (source) => {
      const target = resolver.domainOf(source.value)

      if (target !== undefined && target !== domain && resolver.domainOrder.indexOf(target) > domainIndex) {
        context.report({ node: source, messageId: 'reversed', data: { domain, target, file } })
      }
    }

    const checkLayer = (source) => {
      const target = resolver.aliasOfSpecifier(source.value)

      if (target === undefined || target === layer) {
        return
      }

      const targetIndex = resolver.layerDependencyOrder.indexOf(target.name)

      if (targetIndex === -1 || targetIndex > layerIndex) {
        context.report({
          node: source,
          messageId: 'layerReversed',
          data: { layer: layer.name, target: target.name, order: resolver.layerDependencyOrder.join(' → ') }
        })
      }
    }

    const check = (source) => {
      if (!isStringLiteral(source)) {
        return
      }

      if (domainIndex !== -1) {
        checkDomain(source)
      }

      if (layer !== undefined) {
        checkLayer(source)
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
