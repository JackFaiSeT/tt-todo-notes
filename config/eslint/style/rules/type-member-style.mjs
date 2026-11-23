const toPropertySignature = (sourceCode, node) => {
  const key = node.computed ? `[${sourceCode.getText(node.key)}]` : sourceCode.getText(node.key)
  const optional = node.optional ? '?' : ''
  const typeParameters = node.typeParameters ? sourceCode.getText(node.typeParameters) : ''
  const params = node.params.map((param) => sourceCode.getText(param)).join(', ')
  const returnType = sourceCode.getText(node.returnType.typeAnnotation)
  const delimiter = /[;,]$/u.exec(sourceCode.getText(node))?.[0] ?? ''

  return `${key}${optional}: ${typeParameters}(${params}) => ${returnType}${delimiter}`
}

export const typeMemberStyleRule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: { description: 'Functions in object types are written as properties, methods stay in class contracts' },
    schema: [],
    messages: {
      methodSignature: "Функция в объектном типе записывается свойством: '{{name}}: () => …'"
    }
  },
  create: (context) => {
    const sourceCode = context.sourceCode

    return {
      'TSTypeLiteral > TSMethodSignature[kind="method"]': (node) => {
        context.report({
          node,
          messageId: 'methodSignature',
          data: { name: sourceCode.getText(node.key) },
          fix: node.returnType ? (fixer) => fixer.replaceText(node, toPropertySignature(sourceCode, node)) : undefined
        })
      }
    }
  }
}
