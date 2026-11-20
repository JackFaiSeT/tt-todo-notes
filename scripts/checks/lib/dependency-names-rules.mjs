import ts from 'typescript'
import { lineOf, parseTypeScript } from './ts-source.mjs'

export const MAX_CONSTRUCTOR_DEPENDENCIES = 10

const VALUE_TYPE_SUFFIX = /(Options|Kind|Key|Id)$/

const INTERFACE_PREFIX = /^I(?=[A-Z])|^\$/

const LEADING_ACRONYM = /^[A-Z]+(?=[A-Z][a-z]|$)|^[A-Z]/

const INJECT_DECORATORS = new Set(['Inject', 'InjectQueue'])

const ERROR_BASE = /(?:^|\.)\w*Error$/

const toCamelCase = (typeName) => typeName.replace(LEADING_ACRONYM, (prefix) => prefix.toLowerCase())

const constantToCamelCase = (constant) =>
  constant.toLowerCase().replace(/_([a-z0-9])/g, (_match, letter) => letter.toUpperCase())

export const expectedDependencyNames = (typeName, token) => {
  const names = [toCamelCase(typeName.replace(INTERFACE_PREFIX, ''))]

  if (token !== undefined) {
    names.push(constantToCamelCase(token))
  }

  return [...new Set(names)]
}

const typeNameOf = (typeNode) => {
  if (typeNode === undefined || !ts.isTypeReferenceNode(typeNode)) {
    return undefined
  }

  const { typeName } = typeNode

  return ts.isIdentifier(typeName) ? typeName.text : typeName.right.text
}

const injectionTokenOf = (parameter) => {
  for (const modifier of parameter.modifiers ?? []) {
    if (!ts.isDecorator(modifier) || !ts.isCallExpression(modifier.expression)) {
      continue
    }

    const { expression, arguments: args } = modifier.expression
    const [token] = args

    if (ts.isIdentifier(expression) && INJECT_DECORATORS.has(expression.text) && token && ts.isIdentifier(token)) {
      return token.text
    }
  }

  return undefined
}

const dependencyOf = (sourceFile, parameter) => {
  const typeName = typeNameOf(parameter.type)

  if (typeName === undefined || !ts.isIdentifier(parameter.name) || VALUE_TYPE_SUFFIX.test(typeName)) {
    return undefined
  }

  return {
    line: lineOf(sourceFile, parameter),
    name: parameter.name.text,
    typeName,
    expected: expectedDependencyNames(typeName, injectionTokenOf(parameter))
  }
}

const constructorOf = (classNode) => classNode.members.find((member) => ts.isConstructorDeclaration(member))

const extendsError = (classNode) =>
  (classNode.heritageClauses ?? []).some(
    (clause) =>
      clause.token === ts.SyntaxKind.ExtendsKeyword &&
      clause.types.some((type) => ERROR_BASE.test(type.expression.getText()))
  )

const classViolations = (file, sourceFile, classNode, limits) => {
  const constructor = constructorOf(classNode)
  const className = classNode.name?.text

  if (constructor === undefined || className === undefined || extendsError(classNode)) {
    return []
  }

  const count = constructor.parameters.length
  const limit = limits[className] ?? MAX_CONSTRUCTOR_DEPENDENCIES
  const violations = []

  if (count > limit || (limits[className] !== undefined && count !== limit)) {
    violations.push({ file, line: lineOf(sourceFile, classNode), className, kind: 'limit', count })
  }

  const dependencies = constructor.parameters.map((parameter) => dependencyOf(sourceFile, parameter)).filter(Boolean)
  const typeCounts = new Map()

  for (const { typeName } of dependencies) {
    typeCounts.set(typeName, (typeCounts.get(typeName) ?? 0) + 1)
  }

  for (const { line, name, typeName, expected } of dependencies) {
    if (typeCounts.get(typeName) === 1 && !expected.includes(name)) {
      violations.push({ file, line, className, kind: 'name', name, expected: [expected[0]] })
    }
  }

  return violations
}

const collectClasses = (node, accumulator) => {
  if (ts.isClassDeclaration(node)) {
    accumulator.push(node)
  }

  ts.forEachChild(node, (child) => {
    collectClasses(child, accumulator)
  })

  return accumulator
}

export const findDependencyNameViolations = ({ file, source, limits = {} }) => {
  const sourceFile = parseTypeScript(file, source)

  return collectClasses(sourceFile, []).flatMap((classNode) => classViolations(file, sourceFile, classNode, limits))
}
