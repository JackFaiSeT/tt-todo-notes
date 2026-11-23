import ts from 'typescript'

export const SHARED_PACKAGE = /^@shared\/contract(\/|$)/

export const parseTypeScript = (file, source) =>
  ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

export const lineOf = (sourceFile, node) => sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1

export const collectImports = (sourceFile) => {
  const imports = new Map()

  for (const statement of sourceFile.statements) {
    const bindings = ts.isImportDeclaration(statement) ? statement.importClause?.namedBindings : undefined

    if (bindings === undefined || !ts.isNamedImports(bindings)) {
      continue
    }

    for (const element of bindings.elements) {
      imports.set(element.name.text, {
        module: statement.moduleSpecifier.text,
        imported: element.propertyName?.text ?? element.name.text
      })
    }
  }

  return imports
}

export const collectSharedImports = (sourceFile) =>
  new Set(
    [...collectImports(sourceFile)].filter(([, { module }]) => SHARED_PACKAGE.test(module)).map(([local]) => local)
  )
