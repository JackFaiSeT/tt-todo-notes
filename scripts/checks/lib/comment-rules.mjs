export const COMMENT_KIND = Object.freeze({
  SCRIPT: 'script',
  VUE: 'vue',
  STYLE: 'style',
  HASH: 'hash',
  MARKUP: 'markup',
  SQL: 'sql'
})

const SCRIPT_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json', '.jsonc', '.tsx', '.jsx']

const STYLE_EXTENSIONS = ['.scss', '.css', '.sass']

const HASH_EXTENSIONS = ['.yaml', '.yml', '.sh', '.conf', '.env', '.toml']

const HASH_FILE_NAMES = new Set([
  '.gitignore',
  '.gitattributes',
  '.editorconfig',
  '.prettierignore',
  '.stylelintignore',
  '.dockerignore',
  '.npmrc',
  '.nvmrc'
])

const DOCKERFILE = /(^|\/)(Dockerfile|[^/]+\.Dockerfile|Dockerfile\.[^/]+)$/

const HASH_COMMENT = /(^|\s)#/

const VUE_BLOCK = /<(script|style)\b[^>]*>([\s\S]*?)<\/\1\s*>/g

const URL_FUNCTION = /url\(\s*(?!['"])/iy

const REGEX_PRECEDING_KEYWORDS = new Set([
  'return',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'throw',
  'case',
  'do',
  'else',
  'yield',
  'await'
])

const REGEX_PRECEDING_PUNCTUATORS = new Set([
  '(',
  ',',
  '=',
  ':',
  '[',
  '!',
  '&',
  '|',
  '?',
  '{',
  '}',
  ';',
  '+',
  '-',
  '*',
  '%',
  '<',
  '>',
  '~',
  '^'
])

const fileName = (file) => file.slice(file.lastIndexOf('/') + 1)

const hasExtension = (name, extensions) => extensions.some((extension) => name.endsWith(extension))

export const commentKindOf = (file) => {
  const name = fileName(file)

  if (DOCKERFILE.test(file)) {
    return COMMENT_KIND.HASH
  }

  if (HASH_FILE_NAMES.has(name) || hasExtension(name, HASH_EXTENSIONS)) {
    return COMMENT_KIND.HASH
  }

  if (name.endsWith('.html') || name.endsWith('.svg')) {
    return COMMENT_KIND.MARKUP
  }

  if (name.endsWith('.sql')) {
    return COMMENT_KIND.SQL
  }

  if (name.endsWith('.vue')) {
    return COMMENT_KIND.VUE
  }

  if (hasExtension(name, STYLE_EXTENSIONS)) {
    return COMMENT_KIND.STYLE
  }

  if (hasExtension(name, SCRIPT_EXTENSIONS)) {
    return COMMENT_KIND.SCRIPT
  }

  return null
}

const lineAt = (source, offset) => source.slice(0, offset).split('\n').length

const createCollector = (source, file) => {
  const violations = []

  const add = (start, end) => {
    const text = source.slice(start, end)

    violations.push({ file, line: lineAt(source, start), text: text.split(/\r?\n/)[0].trim() })
  }

  return { violations, add }
}

const lineEnd = (source, start) => {
  const end = source.indexOf('\n', start)

  return end === -1 ? source.length : end
}

const blockEnd = (source, start) => {
  const end = source.indexOf('*/', start + 2)

  return end === -1 ? source.length : end + 2
}

const skipQuoted = (source, start) => {
  const quote = source[start]
  let index = start + 1

  while (index < source.length && source[index] !== quote && source[index] !== '\n') {
    index += source[index] === '\\' ? 2 : 1
  }

  return index + 1
}

const skipRegex = (source, start) => {
  let index = start + 1
  let isInsideClass = false

  while (index < source.length && source[index] !== '\n') {
    const character = source[index]

    if (character === '\\') {
      index += 2
      continue
    }

    if (character === '/' && !isInsideClass) {
      return index + 1
    }

    if (character === '[') {
      isInsideClass = true
    } else if (character === ']') {
      isInsideClass = false
    }

    index += 1
  }

  return index
}

const previousToken = (source, start) => {
  let end = start - 1

  while (end >= 0 && /\s/.test(source[end])) {
    end -= 1
  }

  if (end < 0) {
    return ''
  }

  if (!/[\w$]/.test(source[end])) {
    return source[end]
  }

  let wordStart = end

  while (wordStart > 0 && /[\w$]/.test(source[wordStart - 1])) {
    wordStart -= 1
  }

  return source.slice(wordStart, end + 1)
}

const startsRegex = (source, start) => {
  const token = previousToken(source, start)

  return token === '' || REGEX_PRECEDING_PUNCTUATORS.has(token) || REGEX_PRECEDING_KEYWORDS.has(token)
}

const scanScript = (source, collector) => {
  const substitutionDepths = []
  let index = 0

  const continueTemplate = (position) => {
    index = position

    while (index < source.length) {
      const character = source[index]

      if (character === '\\') {
        index += 2
      } else if (character === '`') {
        index += 1

        return
      } else if (character === '$' && source[index + 1] === '{') {
        substitutionDepths.push(0)
        index += 2

        return
      } else {
        index += 1
      }
    }
  }

  while (index < source.length) {
    const character = source[index]
    const next = source[index + 1]
    const depth = substitutionDepths.at(-1)

    if (character === '/' && next === '/') {
      const end = lineEnd(source, index)

      collector.add(index, end)
      index = end
    } else if (character === '/' && next === '*') {
      const end = blockEnd(source, index)

      collector.add(index, end)
      index = end
    } else if (character === "'" || character === '"') {
      index = skipQuoted(source, index)
    } else if (character === '`') {
      continueTemplate(index + 1)
    } else if (character === '/' && startsRegex(source, index)) {
      index = skipRegex(source, index)
    } else if (character === '}' && depth === 0) {
      substitutionDepths.pop()
      continueTemplate(index + 1)
    } else {
      if (depth !== undefined && (character === '{' || character === '}')) {
        substitutionDepths[substitutionDepths.length - 1] += character === '{' ? 1 : -1
      }

      index += 1
    }
  }
}

const scanStyle = (source, collector) => {
  let index = 0

  while (index < source.length) {
    const character = source[index]
    const next = source[index + 1]

    URL_FUNCTION.lastIndex = index

    if (URL_FUNCTION.test(source)) {
      const end = source.indexOf(')', URL_FUNCTION.lastIndex)

      index = end === -1 ? source.length : end + 1
    } else if (character === '/' && next === '*') {
      const end = blockEnd(source, index)

      collector.add(index, end)
      index = end
    } else if (character === '/' && next === '/') {
      const end = lineEnd(source, index)

      collector.add(index, end)
      index = end
    } else if (character === "'" || character === '"') {
      index = skipQuoted(source, index)
    } else {
      index += 1
    }
  }
}

const scanMarkup = (source, collector) => {
  let index = source.indexOf('<!--')

  while (index !== -1) {
    const close = source.indexOf('-->', index + 4)
    const end = close === -1 ? source.length : close + 3

    collector.add(index, end)
    index = source.indexOf('<!--', end)
  }
}

const blank = (text) => text.replace(/[^\n]/g, ' ')

const keepRanges = (source, ranges) => {
  let masked = ''
  let cursor = 0

  for (const [start, end] of ranges) {
    masked += blank(source.slice(cursor, start)) + source.slice(start, end)
    cursor = end
  }

  return masked + blank(source.slice(cursor))
}

const blankRanges = (source, ranges) =>
  ranges.reduce(
    (masked, [start, end]) => masked.slice(0, start) + blank(masked.slice(start, end)) + masked.slice(end),
    source
  )

const scanVue = (source, file) => {
  const blocks = { script: [], style: [], all: [] }

  for (const match of source.matchAll(VUE_BLOCK)) {
    const contentStart = match.index + match[0].indexOf('>') + 1

    blocks[match[1]].push([contentStart, contentStart + match[2].length])
    blocks.all.push([match.index, match.index + match[0].length])
  }

  const collector = createCollector(source, file)

  scanScript(keepRanges(source, blocks.script), collector)
  scanStyle(keepRanges(source, blocks.style), collector)
  scanMarkup(blankRanges(source, blocks.all), collector)

  return collector.violations.sort((left, right) => left.line - right.line)
}

const stripQuoted = (line) => line.replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/"(?:[^"\\]|\\.)*"/g, '""')

const DRIZZLE_STATEMENT_BREAKPOINT = '--> statement-breakpoint'

const scanSql = (source, file, collector) => {
  const tokens =
    /'(?:''|[^'])*(?:'|$)|"(?:""|[^"])*(?:"|$)|`(?:``|[^`])*(?:`|$)|\[[^\]]*(?:\]|$)|--[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/g

  for (const match of source.matchAll(tokens)) {
    const token = match[0]

    if (file.startsWith('src/server/database/migrations/') && token.trimEnd() === DRIZZLE_STATEMENT_BREAKPOINT) {
      continue
    }

    if (token.startsWith('--') || token.startsWith('/*')) {
      collector.add(match.index, match.index + token.length)
    }
  }
}

const scanHash = (source, file) => {
  const violations = []

  source.split(/\r?\n/).forEach((line, index) => {
    const stripped = stripQuoted(line)

    if (HASH_COMMENT.test(stripped)) {
      violations.push({ file, line: index + 1, text: line.trim() })
    }
  })

  return violations
}

export const findCommentViolations = (source, file) => {
  const kind = commentKindOf(file)

  if (kind === COMMENT_KIND.VUE) {
    return scanVue(source, file)
  }

  if (kind === COMMENT_KIND.HASH) {
    return scanHash(source, file)
  }

  const collector = createCollector(source, file)

  if (kind === COMMENT_KIND.SQL) {
    scanSql(source, file, collector)
  }

  if (kind === COMMENT_KIND.MARKUP) {
    scanMarkup(source, collector)
  }

  if (kind === COMMENT_KIND.STYLE) {
    scanStyle(source, collector)
  } else if (kind === COMMENT_KIND.SCRIPT) {
    scanScript(source, collector)
  }

  return collector.violations
}
