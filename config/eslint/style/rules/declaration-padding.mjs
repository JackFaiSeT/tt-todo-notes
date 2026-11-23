const isReexport = (node) =>
  node.type === 'ExportAllDeclaration' || (node.type === 'ExportNamedDeclaration' && node.source !== null)

const isGroupedPair = (previous, next) =>
  (previous.type === 'ImportDeclaration' && next.type === 'ImportDeclaration') ||
  (isReexport(previous) && isReexport(next))

export const declarationPaddingRule = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: { description: 'Top-level and namespace declarations are separated by a blank line' },
    schema: [],
    messages: {
      missingBlankLine: 'Объявления верхнего уровня и пространства имён разделяются пустой строкой'
    }
  },
  create: (context) => {
    const sourceCode = context.sourceCode

    const checkBody = (statements) => {
      statements.slice(1).forEach((next, index) => {
        const previous = statements[index]

        if (isGroupedPair(previous, next)) {
          return
        }

        const previousToken = sourceCode.getLastToken(previous)
        const nextToken = sourceCode.getFirstToken(next, { includeComments: true })

        if (nextToken.loc.start.line - previousToken.loc.end.line > 1) {
          return
        }

        context.report({
          node: next,
          messageId: 'missingBlankLine',
          fix: (fixer) => fixer.insertTextAfter(previousToken, '\n')
        })
      })
    }

    return {
      Program: (node) => checkBody(node.body),
      TSModuleBlock: (node) => checkBody(node.body)
    }
  }
}
