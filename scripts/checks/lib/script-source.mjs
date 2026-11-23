const QUOTES = new Set(["'", '"'])

const BACKSLASH = '\\'

const SCRIPT_OUTSIDE_BLOCKS = /(^|<\/script>)([\s\S]*?)(<script\b[^>]*>|$)/g

const blank = (character) => (character === '\n' ? '\n' : ' ')

export const readScript = (source, file) => {
  if (!file.endsWith('.vue')) {
    return source
  }

  return source.replace(SCRIPT_OUTSIDE_BLOCKS, (_, open, outside, close) =>
    [open, outside.replace(/[^\n]/g, ''), close].join('')
  )
}

export const maskStrings = (source) => {
  const braces = []
  let mode = 'code'
  let masked = ''
  let index = 0

  while (index < source.length) {
    const character = source[index]

    if (mode === 'code') {
      if (QUOTES.has(character)) {
        mode = character
      } else if (character === '`') {
        mode = 'template'
      } else if (character === '{') {
        braces.push('code')
      } else if (character === '}' && braces.pop() === 'template') {
        mode = 'template'
      }

      masked += character
      index += 1
      continue
    }

    if (character === BACKSLASH) {
      masked += blank(character) + blank(source[index + 1] ?? '')
      index += 2
      continue
    }

    if (mode === 'template' && character === '$' && source[index + 1] === '{') {
      braces.push('template')
      mode = 'code'
      masked += '${'
      index += 2
      continue
    }

    if ((mode === 'template' && character === '`') || character === mode) {
      mode = 'code'
      masked += character
      index += 1
      continue
    }

    masked += blank(character)
    index += 1
  }

  return masked
}

export const toLineNumber = (source, offset) => source.slice(0, offset).split('\n').length

export const toScriptEntry = (file, source) => ({
  file,
  source,
  script: maskStrings(readScript(source, file)).replace(/\r/g, '')
})
