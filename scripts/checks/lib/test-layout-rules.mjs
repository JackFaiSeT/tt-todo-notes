const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/

const TESTS_ROOT = /^tests\//

const FRONTEND_UNIT_TEST = /^tests\/(?:unit|integration)\/(.+?)(?:\.integration)?\.(?:test|spec)\.[cm]?[jt]sx?$/

const FRONTEND_E2E_SPEC = /^tests\/e2e\/(.+)\/[^/]+\.spec\.ts$/

const FRONTEND_E2E_ROOT_SPEC = /^tests\/e2e\/[^/]+\.spec\.ts$/

const PAGE_FILE = /^(?:src\/)?app\/pages\/(.+)\.vue$/

const LAYOUT_FILE = /^(?:src\/)?app\/layouts\/([^/]+)\//

const ERROR_PAGE = /^(?:src\/)?app\/error\.vue$/

const SOURCE_EXTENSIONS = Object.freeze(['.ts', '.mts', '.mjs', '.vue', '/index.ts', '/index.vue'])

const PAGE_SERVICE_SEGMENTS = new Set(['components', 'composables', 'constants', 'types', 'utils', 'styles'])

const E2E_CHECK_KINDS = ['a11y', 'flows', 'smoke']

export const TEST_LAYOUT_REASON = Object.freeze({
  UNKNOWN_SUITE: 'test must belong to unit, integration or a recognized e2e suite',
  OUTSIDE_TESTS: 'test file outside tests/',
  NO_SOURCE: (candidates) => `test does not mirror a source file: expected ${candidates.join(' or ')}`,
  E2E_DIRECTORY: (directory) =>
    `e2e spec directory ${directory} is neither a page route, a layout, error nor a check kind of the application`,
  E2E_ROOT: 'e2e spec directly in tests/e2e of the application, put it into a page route or a check kind directory'
})

const sourceCandidates = (relative, bases) =>
  bases.flatMap((base) => SOURCE_EXTENSIONS.map((extension) => `${base}${relative}${extension}`))

const mirrorViolationOf = (path, relative, bases, known) => {
  const candidates = sourceCandidates(relative, bases)

  if (candidates.some((candidate) => known.has(candidate))) {
    return null
  }

  return { path, reason: TEST_LAYOUT_REASON.NO_SOURCE(bases.map((base) => `${base}${relative}.*`)) }
}

const ancestorsOf = (directory) =>
  directory.split('/').map((_segment, index, segments) => segments.slice(0, index + 1).join('/'))

const collectE2eDirectories = (files) => {
  const directories = new Set()

  for (const path of files) {
    const page = PAGE_FILE.exec(path)

    if (page !== null) {
      const [, route] = page
      const directory = route.endsWith('/index') || route === 'index' ? route.replace(/\/?index$/, '') : route

      for (const ancestor of ancestorsOf(directory)) {
        if (ancestor !== '' && !ancestor.split('/').some((segment) => PAGE_SERVICE_SEGMENTS.has(segment))) {
          directories.add(ancestor)
        }
      }
    }

    const layout = LAYOUT_FILE.exec(path)

    if (layout !== null) {
      directories.add(`layouts/${layout[1]}`)
    }

    const error = ERROR_PAGE.exec(path)

    if (error !== null) {
      directories.add('error')
    }
  }

  return directories
}

const e2eViolationOf = (path, directories) => {
  const rootSpec = FRONTEND_E2E_ROOT_SPEC.exec(path)

  if (rootSpec !== null) {
    return { path, reason: TEST_LAYOUT_REASON.E2E_ROOT }
  }

  const match = FRONTEND_E2E_SPEC.exec(path)

  if (match === null) {
    return { path, reason: TEST_LAYOUT_REASON.UNKNOWN_SUITE }
  }

  const [, directory] = match
  const [kind] = directory.split('/')

  if (E2E_CHECK_KINDS.includes(kind) || directories.has(directory)) {
    return null
  }

  return { path, reason: TEST_LAYOUT_REASON.E2E_DIRECTORY(directory) }
}

const violationOf = (path, known, directories) => {
  if (!TESTS_ROOT.test(path)) {
    return { path, reason: TEST_LAYOUT_REASON.OUTSIDE_TESTS }
  }

  const frontend = FRONTEND_UNIT_TEST.exec(path)

  if (frontend !== null) {
    const relative = frontend[1]

    const bases = /^(?:core|app|server|shared)\//u.test(relative) ? ['src/'] : ['']

    if (relative.startsWith('src/') || relative.startsWith('tests/')) {
      return { path, reason: TEST_LAYOUT_REASON.UNKNOWN_SUITE }
    }

    return mirrorViolationOf(path, relative, bases, known)
  }

  return e2eViolationOf(path, directories)
}

export const findTestLayoutViolations = (files) => {
  const known = new Set(files)
  const directories = collectE2eDirectories(files)

  return files
    .filter((path) => TEST_FILE.test(path))
    .map((path) => violationOf(path, known, directories))
    .filter((violation) => violation !== null)
}
