import { compareKeys, createImportResolver } from '../resolver.mjs'
import { SETTINGS_SCHEMA } from '../settings-schema.mjs'

const BLANK_LINE_PATTERN = /\n[\t ]*\r?\n/u

const isSortableImport = (node) => node.type === 'ImportDeclaration' && node.specifiers.length > 0

const lineEndOf = (text, index) => {
  const newline = text.indexOf('\n', index)

  return newline === -1 ? text.length : newline
}

const lineStartOf = (text, index) => text.lastIndexOf('\n', index - 1) + 1

const isCommentOnly = (value) => {
  const trimmed = value.trim()

  return trimmed === '' || trimmed.startsWith('//') || (trimmed.startsWith('/*') && trimmed.endsWith('*/'))
}

const stripComments = (text, offset, comments) => {
  let result = text

  for (const comment of comments) {
    const start = comment.range[0] - offset
    const end = comment.range[1] - offset

    if (start >= 0 && end <= text.length) {
      result = `${result.slice(0, start)}${' '.repeat(end - start)}${result.slice(end)}`
    }
  }

  return result
}

const gapOf = (sourceCode, previous, next) => {
  const offset = previous.range[1]
  const raw = sourceCode.text.slice(offset, next.range[0])

  const comments = sourceCode
    .getAllComments()
    .filter((comment) => comment.range[0] >= offset && comment.range[1] <= next.range[0])

  return stripComments(raw, offset, comments)
}

const collectRuns = (body, sourceCode) => {
  const runs = []
  let current = []

  for (const node of body) {
    const previous = current.at(-1)

    if (isSortableImport(node) && previous !== undefined && gapOf(sourceCode, previous, node).trim() === '') {
      current.push(node)
      continue
    }

    if (current.length > 0) {
      runs.push(current)
    }

    current = isSortableImport(node) ? [node] : []
  }

  if (current.length > 0) {
    runs.push(current)
  }

  return runs
}

const longestOrderedSubsequence = (positions) => {
  const lengths = positions.map(() => 1)
  const previous = positions.map(() => -1)

  for (let index = 0; index < positions.length; index += 1) {
    for (let before = 0; before < index; before += 1) {
      if (positions[before] < positions[index] && lengths[before] + 1 > lengths[index]) {
        lengths[index] = lengths[before] + 1
        previous[index] = before
      }
    }
  }

  const kept = new Set()
  let cursor = lengths.indexOf(Math.max(...lengths))

  while (cursor !== -1) {
    kept.add(cursor)
    cursor = previous[cursor]
  }

  return kept
}

const buildChunks = (text, run) => {
  const firstStart = run[0].range[0]
  const firstLineStart = lineStartOf(text, firstStart)
  const start = text.slice(firstLineStart, firstStart).trim() === '' ? firstLineStart : firstStart
  const chunks = []
  let chunkStart = start

  for (const node of run) {
    const lineEnd = lineEndOf(text, node.range[1])

    if (!isCommentOnly(text.slice(node.range[1], lineEnd))) {
      return undefined
    }

    const lines = text
      .slice(chunkStart, lineEnd)
      .split('\n')
      .filter((line) => line.trim() !== '')

    chunks.push(lines.join('\n'))
    chunkStart = lineEnd + 1
  }

  return { start, end: chunkStart - 1, chunks }
}

export const importOrderRule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: { description: 'Imports go from the farthest to the nearest module' },
    schema: [SETTINGS_SCHEMA],
    messages: {
      order:
        "Импорт '{{source}}' не на своём месте: {{place}}. Порядок — от дальнего к ближнему: пакеты, алиасы слоёв от общих к частным, затем относительные пути",
      blankLine: 'Между импортами нет пустых строк'
    }
  },
  create: (context) => {
    const resolver = createImportResolver(context.options[0] ?? {}, context.filename)
    const { sourceCode } = context

    const checkRun = (run) => {
      const keys = run.map((node) => resolver.orderKey(node.source.value, node.importKind === 'type'))
      const sorted = run.map((_node, index) => index).sort((left, right) => compareKeys(keys[left], keys[right]))
      const positions = run.map((_node, index) => sorted.indexOf(index))
      const kept = longestOrderedSubsequence(positions)
      const misplaced = run.filter((_node, index) => !kept.has(index))

      const blankAfter = run.findIndex(
        (node, index) => index > 0 && BLANK_LINE_PATTERN.test(gapOf(sourceCode, run[index - 1], node))
      )

      if (misplaced.length === 0 && blankAfter === -1) {
        return
      }

      const layout = buildChunks(sourceCode.text, run)

      const fix =
        layout === undefined
          ? undefined
          : (fixer) =>
              fixer.replaceTextRange([layout.start, layout.end], sorted.map((index) => layout.chunks[index]).join('\n'))

      for (const node of misplaced) {
        const position = sorted.indexOf(run.indexOf(node))
        const before = position > 0 ? run[sorted[position - 1]] : undefined

        context.report({
          node,
          messageId: 'order',
          data: {
            source: node.source.value,
            place:
              before === undefined
                ? `его место первым, перед '${run[sorted[1]].source.value}'`
                : `его место после '${before.source.value}'`
          },
          fix
        })
      }

      if (misplaced.length === 0) {
        context.report({ node: run[blankAfter], messageId: 'blankLine', fix })
      }
    }

    return {
      Program: (program) => {
        for (const run of collectRuns(program.body, sourceCode)) {
          checkRun(run)
        }
      }
    }
  }
}
