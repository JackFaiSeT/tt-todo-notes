export const noObjectMethodRule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Functions in object literals are written as arrow properties' },
    schema: [],
    messages: {
      objectMethod: "Функция в объекте записывается стрелочным свойством: '{{name}}: () => …'"
    }
  },
  create: (context) => ({
    'Property[method=true][kind="init"]': (node) => {
      context.report({ node, messageId: 'objectMethod', data: { name: context.sourceCode.getText(node.key) } })
    }
  })
}
