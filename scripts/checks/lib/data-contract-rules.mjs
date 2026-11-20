import ts from 'typescript'
import { collectSharedImports, lineOf, parseTypeScript, SHARED_PACKAGE } from './ts-source.mjs'

const DATA_CONTRACTS_FILE = /^src\/core\/[^/]+\/domain\/data-contracts\.ts$/

const ADAPTER_FILE = /^src\/core\/[^/]+\/(?:[\w-]+-)?adapter\.ts$/

const ADAPTER_INTERFACE = /^I\w+Adapter$/

const REQUEST_CONTRACT = /(?:RequestBody|RequestParams)$/

const UNTRUSTED_TYPE = 'Untrusted'

const UTILITY_TYPES = new Set([
  'Array',
  'Exclude',
  'Extract',
  'NonNullable',
  'Omit',
  'Partial',
  'Pick',
  'Readonly',
  'ReadonlyArray',
  'Record',
  'Required'
])

export const isDataContractsFile = (file) => DATA_CONTRACTS_FILE.test(file)

export const isAdapterFile = (file) => ADAPTER_FILE.test(file)

const isNamespace = (statement) =>
  ts.isModuleDeclaration(statement) &&
  ts.isIdentifier(statement.name) &&
  (statement.flags & ts.NodeFlags.Namespace) !== 0

const leftmostName = (name) => (ts.isIdentifier(name) ? name.text : leftmostName(name.left))

const referencedTypeNames = (typeNode) => {
  const names = []

  const visit = (node) => {
    if (ts.isTypeReferenceNode(node)) {
      names.push(leftmostName(node.typeName))
    }

    ts.forEachChild(node, visit)
  }

  visit(typeNode)

  return names
}

const hasObjectShape = (typeNode) => {
  let found = false

  const visit = (node) => {
    if (ts.isTypeLiteralNode(node) || ts.isMappedTypeNode(node)) {
      found = true
    }

    ts.forEachChild(node, visit)
  }

  visit(typeNode)

  return found
}

const isUntrustedWrapper = (typeNode) =>
  ts.isTypeReferenceNode(typeNode) &&
  ts.isIdentifier(typeNode.typeName) &&
  typeNode.typeName.text === UNTRUSTED_TYPE &&
  typeNode.typeArguments?.length === 1

const isOwnMemberReference = (typeNode, namespaceName) =>
  ts.isTypeReferenceNode(typeNode) &&
  ts.isQualifiedName(typeNode.typeName) &&
  leftmostName(typeNode.typeName) === namespaceName

const checkReferences = (alias, sharedImports, namespaceName, report) => {
  const name = alias.name.text

  if (hasObjectShape(alias.type)) {
    report(alias, `${name} describes the shape locally; wrap a type of @shared/contract instead`)

    return
  }

  const references = referencedTypeNames(alias.type).filter(
    (reference) => reference !== UNTRUSTED_TYPE && reference !== namespaceName && !UTILITY_TYPES.has(reference)
  )

  if (references.length === 0 && !isOwnMemberReference(alias.type, namespaceName)) {
    report(alias, `${name} does not refer to a type of @shared/contract`)
  }

  for (const reference of references.filter((item) => !sharedImports.has(item))) {
    report(alias, `${name} refers to ${reference}, which is not imported from @shared/contract`)
  }
}

const checkContractAlias = (alias, sharedImports, namespaceName, report) => {
  const name = alias.name.text
  const isRequest = REQUEST_CONTRACT.test(name)

  checkReferences(alias, sharedImports, namespaceName, report)

  if (isRequest && referencedTypeNames(alias.type).includes(UNTRUSTED_TYPE)) {
    report(alias, `${name} is a request the frontend builds; alias the exact type of @shared/contract`)
  }

  if (!isRequest && !isUntrustedWrapper(alias.type) && !isOwnMemberReference(alias.type, namespaceName)) {
    report(alias, `${name} is a response; wrap the type of @shared/contract into Untrusted<…>`)
  }
}

const checkNamespace = (namespace, sharedImports, report) => {
  const body = namespace.body

  if (body === undefined || !ts.isModuleBlock(body)) {
    return
  }

  for (const member of body.statements) {
    if (ts.isTypeAliasDeclaration(member)) {
      checkContractAlias(member, sharedImports, namespace.name.text, report)
    } else if (ts.isInterfaceDeclaration(member)) {
      report(member, `interface ${member.name.text} copies the contract; wrap a type of @shared/contract instead`)
    }
  }
}

const checkContractStatement = (statement, sharedImports, report) => {
  if (ts.isImportDeclaration(statement)) {
    if (!SHARED_PACKAGE.test(statement.moduleSpecifier.text)) {
      report(
        statement,
        `imports ${statement.moduleSpecifier.text}; data contracts take types only from @shared/contract`
      )
    }

    return
  }

  if (isNamespace(statement)) {
    checkNamespace(statement, sharedImports, report)
  }
}

export const findDataContractViolations = (file, source) => {
  const sourceFile = parseTypeScript(file, source)
  const sharedImports = collectSharedImports(sourceFile)
  const violations = []
  const report = (node, message) => violations.push({ file, line: lineOf(sourceFile, node), message })

  for (const statement of sourceFile.statements) {
    checkContractStatement(statement, sharedImports, report)
  }

  return violations
}

const isConstAssertion = (node) =>
  ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName) && node.type.typeName.text === 'const'

export const findAdapterViolations = (file, source) => {
  const sourceFile = parseTypeScript(file, source)
  const violations = []
  const report = (node, message) => violations.push({ file, line: lineOf(sourceFile, node), message })

  for (const statement of sourceFile.statements) {
    const isLocalType = ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)

    if (isLocalType && !ADAPTER_INTERFACE.test(statement.name.text)) {
      report(
        statement,
        `${statement.name.text} is declared in the adapter; the adapter takes DTO types from domain/data-contracts`
      )
    }
  }

  const visit = (node) => {
    if ((ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) && !isConstAssertion(node)) {
      report(node, `casts with "${node.type.getText(sourceFile)}"; map every field with a fallback instead`)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return violations
}
