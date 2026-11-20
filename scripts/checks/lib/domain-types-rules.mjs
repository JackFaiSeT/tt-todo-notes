import ts from 'typescript'
import { lineOf, parseTypeScript } from './ts-source.mjs'

const DOMAIN_FILE = /^src\/core\/([^/]+)\/domain\/(.+)$/

const DOMAIN_TYPE_FILES = new Set(['index.ts', 'data-contracts.ts'])

const MODEL_NAMESPACE = /^N[A-Z][A-Za-z0-9]*$/

const CONTRACTS_NAMESPACE = /^N[A-Z][A-Za-z0-9]*DataContracts$/

const DATA_CONTRACTS_MODULE = /(^|\/)data-contracts(\.ts)?$/

const UNTRUSTED_TYPE = 'Untrusted'

const RUNTIME_KINDS = new Map([
  [ts.SyntaxKind.VariableStatement, 'a variable'],
  [ts.SyntaxKind.FunctionDeclaration, 'a function'],
  [ts.SyntaxKind.ClassDeclaration, 'a class'],
  [ts.SyntaxKind.EnumDeclaration, 'an enum'],
  [ts.SyntaxKind.ExportAssignment, 'a default export'],
  [ts.SyntaxKind.ExpressionStatement, 'an expression'],
  [ts.SyntaxKind.ImportEqualsDeclaration, 'an import alias']
])

export const isDomainFile = (file) => DOMAIN_FILE.test(file)

const domainFileName = (file) => DOMAIN_FILE.exec(file)?.[2]

const isContractsFile = (file) => domainFileName(file) === 'data-contracts.ts'

const runtimeKindOf = (statement) => RUNTIME_KINDS.get(statement.kind) ?? 'runtime code'

const isTypeOnlyImport = (statement) => {
  const clause = statement.importClause

  if (clause === undefined) {
    return false
  }

  if (clause.isTypeOnly) {
    return true
  }

  const bindings = clause.namedBindings

  return (
    clause.name === undefined &&
    bindings !== undefined &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((element) => element.isTypeOnly)
  )
}

const isTypeOnlyExport = (statement) =>
  statement.isTypeOnly ||
  (statement.exportClause !== undefined &&
    ts.isNamedExports(statement.exportClause) &&
    statement.exportClause.elements.length > 0 &&
    statement.exportClause.elements.every((element) => element.isTypeOnly))

const isExported = (statement) =>
  (ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Export) === ts.ModifierFlags.Export

const isNamespace = (statement) =>
  ts.isModuleDeclaration(statement) &&
  ts.isIdentifier(statement.name) &&
  (statement.flags & ts.NodeFlags.Namespace) !== 0

const referencesUntrusted = (node) => {
  let found = false

  const visit = (child) => {
    if (ts.isTypeReferenceNode(child) && ts.isIdentifier(child.typeName) && child.typeName.text === UNTRUSTED_TYPE) {
      found = true
    }

    ts.forEachChild(child, visit)
  }

  visit(node)

  return found
}

const checkNamespaceBody = (namespace, report) => {
  const body = namespace.body

  if (body === undefined || !ts.isModuleBlock(body)) {
    return
  }

  for (const member of body.statements) {
    if (ts.isTypeAliasDeclaration(member) || ts.isInterfaceDeclaration(member)) {
      continue
    }

    if (isNamespace(member)) {
      checkNamespaceBody(member, report)

      continue
    }

    report(member, `namespace ${namespace.name.text} holds ${runtimeKindOf(member)}; domain/ holds only types`)
  }
}

const checkImport = (statement, file, report) => {
  if (!isTypeOnlyImport(statement)) {
    report(statement, `imports values from ${statement.moduleSpecifier.text}; domain/ imports only types`)
  }

  if (!isContractsFile(file) && DATA_CONTRACTS_MODULE.test(statement.moduleSpecifier.text)) {
    report(statement, 'the model imports data contracts; the adapter connects them')
  }
}

const checkTopLevel = (statement, file, namespaces, report) => {
  if (ts.isImportDeclaration(statement)) {
    checkImport(statement, file, report)

    return
  }

  if (ts.isExportDeclaration(statement)) {
    report(
      statement,
      isTypeOnlyExport(statement)
        ? 'domain/ declares its namespace instead of re-exporting types'
        : 'domain/ re-exports values; it holds only types'
    )

    return
  }

  if (isNamespace(statement)) {
    namespaces.push(statement)
    checkNamespaceBody(statement, report)

    if (!isExported(statement)) {
      report(statement, `namespace ${statement.name.text} is not exported`)
    }

    return
  }

  if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
    report(statement, `${statement.name.text} is declared outside the namespace; put it into the domain namespace`)

    return
  }

  report(statement, `domain/ holds ${runtimeKindOf(statement)}; move functions to utils/ and constants to constants/`)
}

const checkNamespaceNames = (file, namespaces, sourceFile, report) => {
  const pattern = isContractsFile(file) ? CONTRACTS_NAMESPACE : MODEL_NAMESPACE
  const expected = isContractsFile(file) ? 'N<Domain>DataContracts' : 'N<Domain>'

  if (namespaces.length !== 1) {
    report(sourceFile, `declares ${namespaces.length} namespaces; expected one ${expected}`)
  }

  for (const namespace of namespaces.filter((item) => !pattern.test(item.name.text))) {
    report(namespace, `namespace ${namespace.name.text} is not named ${expected}`)
  }
}

export const findDomainTypeViolations = (file, source) => {
  const name = domainFileName(file)

  if (name === undefined) {
    return []
  }

  if (!DOMAIN_TYPE_FILES.has(name)) {
    return [
      {
        file,
        line: 1,
        message: `domain/${name} is not a type file; domain/ holds only index.ts and data-contracts.ts`
      }
    ]
  }

  const sourceFile = parseTypeScript(file, source)
  const violations = []
  const namespaces = []

  const report = (node, message) =>
    violations.push({ file, line: node === sourceFile ? 1 : lineOf(sourceFile, node), message })

  for (const statement of sourceFile.statements) {
    checkTopLevel(statement, file, namespaces, report)
  }

  checkNamespaceNames(file, namespaces, sourceFile, report)

  if (!isContractsFile(file)) {
    for (const namespace of namespaces.filter(referencesUntrusted)) {
      report(namespace, `namespace ${namespace.name.text} uses Untrusted; models hold checked values`)
    }
  }

  return violations
}
