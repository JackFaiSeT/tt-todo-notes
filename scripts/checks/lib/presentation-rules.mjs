import { posix } from 'node:path'
import { parse } from 'vue/compiler-sfc'
import ts from 'typescript'

const loaders = /^(?:use(?:Lazy)?(?:AsyncData|Fetch)|fetch|\$fetch|\$services|\w+(?:Api|Service))$/u

const common = /\/components\/common\/|^src\/shared\/(?:components|uikit)\//u

const runtimeDependencies = ({ file, source }) => {
  const descriptor = file.endsWith('.vue') && parse(source).descriptor
  const script = descriptor ? [descriptor.script?.content, descriptor.scriptSetup?.content].join('\n') : source
  const ast = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const imports = []
  let loader

  const visit = (node) => {
    if (ts.isTypeNode(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      return
    }

    if (
      (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) ||
      ((ts.isExportDeclaration(node) || ts.isImportSpecifier(node) || ts.isExportSpecifier(node)) && node.isTypeOnly)
    ) {
      return
    }

    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const bindings = ts.isImportDeclaration(node) ? node.importClause?.namedBindings : node.exportClause

      if (
        bindings &&
        'elements' in bindings &&
        bindings.elements.length &&
        bindings.elements.every((item) => item.isTypeOnly) &&
        !node.importClause?.name
      ) {
        return
      }

      if (node.moduleSpecifier) {
        imports.push(node.moduleSpecifier.text)
      }
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      imports.push(node.arguments[0].text)
    }

    if (ts.isIdentifier(node) && loaders.test(node.text)) {
      loader = node.text
    }

    ts.forEachChild(node, visit)
  }

  visit(ast)

  return { imports, loader }
}

export const findPresentationViolations = (entries, resolveTarget) => {
  const sources = new Map(entries.map((entry) => [entry.file, entry]))
  const parsed = new Map()
  const violations = []

  for (const { file } of entries.filter((entry) => common.test(entry.file))) {
    const seen = new Set()

    const inspect = (path, chain) => {
      if (seen.has(path)) {
        return
      }

      seen.add(path)

      if (!parsed.has(path)) {
        parsed.set(path, runtimeDependencies(sources.get(path)))
      }

      const { imports, loader } = parsed.get(path)

      if (loader) {
        violations.push([...chain, loader].join(' → '))
      }

      for (const specifier of imports) {
        if (/(?:^|\/)(?:api|service)(?:\.[cm]?ts)?$/u.test(specifier)) {
          violations.push([...chain, specifier].join(' → '))
        }

        const target = resolveTarget(specifier, path)

        if (!target) {
          continue
        }

        const next = [target, target + '.ts', target + '/index.ts'].find((key) => sources.has(key))

        if (next) {
          inspect(next, [...chain, next])
        }
      }
    }

    inspect(file, [file])
  }

  return violations
}

export const findStyleViolations = ({ file, source }, readStyle) => {
  if (!file.endsWith('.vue')) {
    return []
  }

  const directory = posix.dirname(file)

  const name = (
    posix.basename(file) === 'index.vue' ? posix.basename(directory) : posix.basename(file, '.vue')
  ).replace(/[.[\]]/gu, '')

  const violations = []

  for (const block of parse(source).descriptor.styles) {
    const match = /^\s*@use ['"]\.\/styles\/([\w-]+)['"];\s*$/u.exec(block.content)
    const style = match && readStyle(posix.join(directory, 'styles', match[1] + '.scss'))

    if (
      block.attrs.lang !== 'scss' ||
      !match ||
      (match[1] !== name && !match[1].startsWith(name + '-')) ||
      typeof style !== 'string' ||
      /\bv-bind\s*\(/u.test(style)
    ) {
      violations.push(file + ' requires an adjacent SCSS file imported with @use')
    }
  }

  return violations
}
