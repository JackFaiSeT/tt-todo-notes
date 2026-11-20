const TRANSPARENT_TYPES = new Set(['TSUnionType', 'TSIntersectionType', 'TSArrayType'])

const findTypeArguments = (node) => {
  let current = node.parent

  while (current && TRANSPARENT_TYPES.has(current.type)) {
    current = current.parent
  }

  return current?.type === 'TSTypeParameterInstantiation' ? current : undefined
}

export const namedTypeArgumentRule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Object types passed as type arguments are declared as named types' },
    schema: [],
    messages: {
      inlineObjectType: 'Объектный тип в аргументе дженерика выносится в именованный тип'
    }
  },
  create: (context) => ({
    TSTypeLiteral: (node) => {
      if (findTypeArguments(node)) {
        context.report({ node, messageId: 'inlineObjectType' })
      }
    }
  })
}
