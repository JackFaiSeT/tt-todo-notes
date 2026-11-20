export const multilineTypeLiteralRule = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: { description: 'Object types in type aliases list each member on its own line' },
    schema: [],
    messages: {
      singleLine: 'Объектный тип в объявлении типа записывается построчно: каждое поле на своей строке'
    }
  },
  create: (context) => {
    const sourceCode = context.sourceCode

    const checkLiteral = (literal) => {
      if (literal.members.length === 0 || literal.loc.start.line !== literal.members[0].loc.start.line) {
        return
      }

      const openingBrace = sourceCode.getFirstToken(literal)

      context.report({
        node: literal,
        messageId: 'singleLine',
        fix: (fixer) => fixer.insertTextAfter(openingBrace, '\n')
      })
    }

    return {
      'TSTypeAliasDeclaration TSTypeLiteral': checkLiteral,
      'TSInterfaceDeclaration TSTypeLiteral': checkLiteral
    }
  }
}
