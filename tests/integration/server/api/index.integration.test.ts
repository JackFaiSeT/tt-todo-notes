import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempDisposableSync } from 'node:fs'
import { get } from 'node:http'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { ERROR_CATEGORIES, ERROR_CODES, HTTP_METHODS, HTTP_STATUS } from '@shared/contract/http'
import {
  NOTE_PAGE_MAX,
  NOTE_SEARCH_MAX,
  NOTE_PREVIEW_TEXT_MAX,
  TITLE_LIMIT,
  TODO_LIMIT,
  ITEM_LIMIT,
  NOTES_PATHS,
  NEW_DRAFT_KEY
} from '@shared/contract/notes/constants'
import { openFirstRoundDatabase } from '../../../factories/first-round-database'
import { createContent, createNewDraft } from '../../../factories/notes'
import { errorEnvelopeSchema, noteSchema } from '../../../factories/response-schemas'
import { buildTestServer, startTestServer } from '../../../setup/nitro'
import { TEST_TEMP_ROOT } from '../../../setup/paths'

const collection = NOTES_PATHS.COLLECTION

const notePath = (id: string): string => NOTES_PATHS.NOTE.replace(':id', id)

const draftPath = (key: string): string => NOTES_PATHS.DRAFT.replace(':key', key)

const body = (data: unknown, method: string = HTTP_METHODS.POST): RequestInit => ({
  method,
  body: JSON.stringify(data),
  headers: { 'content-type': 'application/json' }
})

describe('Notes/Routes', () => {
  let buildDirectory: ReturnType<typeof mkdtempDisposableSync>
  let output: string
  let server: Awaited<ReturnType<typeof startTestServer>>

  beforeAll(async () => {
    mkdirSync(TEST_TEMP_ROOT, { recursive: true })
    buildDirectory = mkdtempDisposableSync(join(TEST_TEMP_ROOT, 'nitro-'))
    output = await buildTestServer(buildDirectory.path)
    server = await startTestServer(output)
  })

  afterAll(async () => {
    await server?.close()
    buildDirectory?.remove()
  })

  it.each([
    { method: HTTP_METHODS.POST, body: undefined },
    { method: HTTP_METHODS.PUT, body: undefined },
    { method: HTTP_METHODS.DELETE, body: 'plain' }
  ])('should require JSON when $method expects or carries a body', async ({ method, body }) => {
    const response = await server.request(draftPath(NEW_DRAFT_KEY), { method, ...(body && { body }) })

    expect(response.status).toBe(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE)
    expect(await response.json()).toMatchObject({ code: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE })
  })

  it('should accept deletion when the request has no body or media type', async () => {
    const response = await server.request(draftPath(NEW_DRAFT_KEY), { method: HTTP_METHODS.DELETE })

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT)
  })

  it.each([{ origin: 'http://other.example.test' }, { 'sec-fetch-site': 'cross-site' }])(
    'should enforce origin when deletion has no body and headers are %j',
    async (headers) => {
      const response = await server.request(draftPath(NEW_DRAFT_KEY), {
        method: HTTP_METHODS.DELETE,
        headers: new Headers(Object.entries(headers))
      })

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN)
      expect(await response.json()).toMatchObject({ code: ERROR_CODES.FORBIDDEN })
    }
  )

  it.each([
    ['/notebook.svg', 'other.example.test', HTTP_STATUS.FORBIDDEN],
    ['/', 'other.example.test', HTTP_STATUS.FORBIDDEN],
    [collection, 'other.example.test', HTTP_STATUS.FORBIDDEN],
    ['/', 'localhost:8080', HTTP_STATUS.OK],
    ['/', '[::1]:8080', HTTP_STATUS.OK],
    ['/', 'notes.example.test:8080', HTTP_STATUS.OK]
  ] as const)('should apply the host policy for %s when the host is %s', async (path, host, status) => {
    const result = await new Promise<number | undefined>((resolve, reject) => {
      get(new URL(path, server.address), { headers: { host } }, (response) => {
        response.resume()
        resolve(response.statusCode)
      }).on('error', reject)
    })

    expect(result).toBe(status)
  })

  it('should authorize the Nuxt bootstrap hash when serving the built SPA', async () => {
    const response = await server.request('/')
    const html = await response.text()

    const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gu)]
      .filter(([, attributes, source]) => source && !attributes?.includes('type="application/json"'))
      .map(([, , source]) => source!)

    expect(scripts.some((source) => source.startsWith('window.__NUXT__='))).toBe(true)

    const policy = response.headers.get('content-security-policy')

    for (const script of scripts) {
      const hash = createHash('sha256').update(script).digest('base64')

      expect(policy).toContain(`'sha256-${hash}'`)
    }

    expect(policy).toContain("frame-ancestors 'none'")
    expect(response.headers.get('x-powered-by')).toBeNull()
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
  })

  it.each([
    'limit=0',
    'limit=1&limit=2',
    'limit=' + (NOTE_PAGE_MAX + 1),
    'cursor=invalid',
    'cursor=9999999999999999.a',
    'q=' + 'я'.repeat(NOTE_SEARCH_MAX + 1),
    'q=a%00b',
    'q=%07'
  ])('should reject the list query when given %s', async (query) => {
    const response = await server.request(collection + '?' + query)

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(await response.json()).toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED })
  })

  it('should continue at the last id when several notes share a timestamp', async () => {
    const path = join(buildDirectory.path, 'cursor.sqlite')
    const instance = await startTestServer(output, path)
    const database = new Database(path)

    try {
      const insert = database.prepare('INSERT INTO notes VALUES (?, ?, 1, ?, 1)')

      for (const [id, time] of [
        ['c', 2],
        ['b', 2],
        ['a', 2],
        ['d', 1]
      ] as const) {
        insert.run(id, id, time)
      }

      const text = 'я'.repeat(NOTE_PREVIEW_TEXT_MAX + 1)

      database.prepare('INSERT INTO todos VALUES (?, ?, 0, ?, 0)').run('item', 'a', text)

      const page = await (await instance.request(collection + '?limit=2')).json()

      expect(page.items.map((note: { id: string }) => note.id)).toEqual(['a', 'b'])
      expect(page.items[0].preview[0].text).toBe(text.slice(0, NOTE_PREVIEW_TEXT_MAX))

      const next = await (
        await instance.request(collection + '?limit=2&cursor=' + encodeURIComponent(page.nextCursor))
      ).json()

      expect(next.items.map((note: { id: string }) => note.id)).toEqual(['c', 'd'])
      expect(next.nextCursor).toBeNull()
      expect(next.count).toBe(4)

      const found = await (await instance.request(collection + '?q=' + encodeURIComponent('  A '))).json()

      expect(found.items.map((note: { id: string }) => note.id)).toEqual(['a'])
      expect(found.count).toBe(1)
    } finally {
      database.close()
      await instance.close()
    }
  })

  it('should distinguish liveness from readiness when the migration journal cannot be read', async () => {
    const path = join(buildDirectory.path, 'probe.sqlite')
    const instance = await startTestServer(output, path)
    const database = new Database(path)

    try {
      database.exec('DROP TABLE __drizzle_migrations')

      const response = await instance.request('/api/readyz')

      expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE)
      expect(response.headers.get('retry-after')).toBe('1')
      expect(await response.json()).toMatchObject({ code: ERROR_CODES.DATABASE_UNAVAILABLE })
      expect((await instance.request('/api/healthz')).status).toBe(HTTP_STATUS.OK)
    } finally {
      database.close()
      await instance.close()
    }
  })

  it('should reject a draft when its history contains an unknown operation', async () => {
    const draft = { ...createNewDraft(), history: { undo: [{}], redo: [] } }
    const response = await server.request(draftPath(NEW_DRAFT_KEY), body({ draft }, HTTP_METHODS.PUT))

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST)

    expect(await response.json()).toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
      fieldErrors: { 'draft.history.undo.0.type': [expect.any(String)] }
    })
  })

  it('should return a JSON validation error when the body is malformed', async () => {
    const response = await server.request(collection, {
      method: HTTP_METHODS.POST,
      headers: { 'content-type': 'application/json' },
      body: '{'
    })

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST)

    expect(await response.json()).toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
      fieldErrors: { $: [expect.any(String)] }
    })
  })

  it('should read a body of exactly one mebibyte and refuse one byte more when posting', async () => {
    const head = '{"title":"x","todos":[],"pad":"'
    const tail = '"}'
    const atLimit = head + 'a'.repeat(1_048_576 - head.length - tail.length) + tail

    const post = (raw: string) =>
      server.request(collection, {
        method: HTTP_METHODS.POST,
        body: raw,
        headers: { 'content-type': 'application/json' }
      })

    const accepted = await post(atLimit)
    const refused = await post(atLimit + ' ')

    expect(accepted.status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(await accepted.json()).toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED })
    expect(refused.status).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE)
  })

  it('should stop reading when the payload exceeds the byte limit', async () => {
    const response = await server.request(collection, body({ title: 'я'.repeat(530000), todos: [] }))

    expect(response.status).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE)
    expect(await response.json()).toMatchObject({ code: ERROR_CODES.PAYLOAD_TOO_LARGE })
  })

  it('should log a missing note at info level with its request id when the route is valid', async () => {
    const response = await server.request(notePath('missing'))

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(await response.json()).toMatchObject({ code: ERROR_CODES.NOTE_NOT_FOUND })

    const requestId = response.headers.get('x-request-id')

    await expect
      .poll(() =>
        server
          .stdout()
          .split('\n')
          .map((line) => JSON.parse(line))
      )
      .toContainEqual(
        expect.objectContaining({ level: 'info', method: HTTP_METHODS.GET, route: '/api/notes/:id', requestId })
      )
  })

  it('should log a missing static asset at info level when an outdated page requests it', async () => {
    const response = await server.request('/_nuxt/outdated-chunk.js')

    const records = () =>
      server
        .stdout()
        .split('\n')
        .map((line) => JSON.parse(line))

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND)

    await expect
      .poll(records)
      .toContainEqual(expect.objectContaining({ level: 'info', msg: 'nitro.error', status: HTTP_STATUS.NOT_FOUND }))

    expect(records()).not.toContainEqual(expect.objectContaining({ level: 'error', msg: 'nitro.error' }))
  })

  it('should preserve the new draft when creating a copy of a deleted note', async () => {
    const draft = createNewDraft()
    const path = draftPath(NEW_DRAFT_KEY)

    expect((await server.request(path, body({ draft }, HTTP_METHODS.PUT))).status).toBe(HTTP_STATUS.NO_CONTENT)
    await server.request(collection, body({ ...createContent(), fromDeletedNote: true }))
    expect(await (await server.request(path)).json()).toEqual(draft)
    await server.request(collection, body(createContent()))
    expect(await (await server.request(path)).json()).toBeNull()
  })

  it('should correlate a safe error with diagnostic frames when a storage operation fails', async () => {
    mkdirSync(TEST_TEMP_ROOT, { recursive: true })
    using directory = mkdtempDisposableSync(join(TEST_TEMP_ROOT, 'notes-failure-'))
    const path = join(directory.path, 'notes.sqlite')
    const instance = await startTestServer(output, path)
    const database = new Database(path)

    try {
      database.exec(
        "CREATE TRIGGER fail_save BEFORE INSERT ON notes BEGIN SELECT RAISE(ABORT, 'private diagnostic'); END"
      )

      const response = await instance.request(collection, body({ title: 'private note content', todos: [] }))

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const problem = await response.json()

      expect(problem).toEqual({
        category: ERROR_CATEGORIES.INTERNAL,
        code: ERROR_CODES.INTERNAL_ERROR,
        message: expect.any(String),
        requestId: response.headers.get('x-request-id')
      })

      expect(JSON.stringify(problem)).not.toContain('private')
      await expect.poll(() => instance.stdout()).toContain(problem.requestId)
      expect(instance.stdout()).toContain('"stack"')
      expect(instance.stdout()).toContain('"errorCode":"SQLITE_CONSTRAINT_TRIGGER"')
      expect(instance.stdout()).toContain('"method":"POST"')
      expect(instance.stdout()).toContain('"route":"/api/notes"')
      expect(instance.stdout()).not.toContain('private')
    } finally {
      database.close()
      await instance.close()
    }
  })

  it.each([
    ['extra', { ...createContent(), extra: true }, 'extra'],
    ['NUL', { ...createContent(), title: 'a\u0000b' }, 'title'],
    ['control', { title: '', todos: [{ id: 'a', text: 'x\u0001', done: false }] }, 'todos.0.text'],
    ['duplicate id', { title: '', todos: [...createContent().todos, ...createContent().todos] }, 'todos'],
    ['empty content', { title: ' ', todos: [] }, 'title'],
    ['title length', { title: 'x'.repeat(TITLE_LIMIT + 1), todos: [] }, 'title'],
    ['todo length', { title: '', todos: [{ id: 'a', text: 'x'.repeat(TODO_LIMIT + 1), done: true }] }, 'todos.0.text'],
    [
      'todo count',
      {
        title: '',
        todos: Array.from({ length: ITEM_LIMIT + 1 }, (_, i) => ({ id: String(i), text: 'x', done: true }))
      },
      'todos'
    ],
    ['invalid type', null, '$']
  ])('should identify the field when the request contains %s', async (_name, input, field) => {
    const response = await server.request(collection, body(input))

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST)

    const problem = errorEnvelopeSchema.parse(await response.json())

    expect(problem).toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
      category: ERROR_CATEGORIES.VALIDATION_FAILED,
      requestId: response.headers.get('x-request-id')
    })

    expect(problem.fieldErrors?.[String(field)]).toContainEqual(expect.any(String))
  })

  it('should enforce the byte limit when the request has no Content-Length', async () => {
    const options = {
      method: HTTP_METHODS.POST,
      duplex: 'half',
      headers: { 'content-type': 'application/json' },
      body: new ReadableStream<Uint8Array>({
        start: (controller) => {
          controller.enqueue(new Uint8Array(700000))
          controller.enqueue(new Uint8Array(700000))
          controller.close()
        }
      })
    }

    const response = await server.request(collection, options)

    expect(response.status).toBe(HTTP_STATUS.PAYLOAD_TOO_LARGE)
    expect(await response.json()).toMatchObject({ code: ERROR_CODES.PAYLOAD_TOO_LARGE })
  })

  it.each(['/api', '/api/unknown/path'])('should return a correlated JSON error when the route is %s', async (path) => {
    const response = await server.request(path, { headers: { 'x-request-id': 'test-request' } })

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-request-id')).toBe('test-request')

    expect(await response.json()).toEqual({
      code: ERROR_CODES.ROUTE_NOT_FOUND,
      category: ERROR_CATEGORIES.NOT_FOUND,
      requestId: 'test-request',
      message: expect.any(String)
    })
  })

  it('should retain the saved version when a stale update conflicts', async () => {
    const content = createContent()
    const created = await server.request(collection, body(content))

    expect(created.status).toBe(HTTP_STATUS.CREATED)

    const { id } = noteSchema.parse(await created.json())
    const input = { ...content, baseVersion: 1 }

    await server.request(notePath(id), body(input, HTTP_METHODS.PUT))

    const stale = await server.request(notePath(id), body({ ...input, title: 'stale' }, HTTP_METHODS.PUT))

    expect(stale.status).toBe(HTTP_STATUS.CONFLICT)
    expect(await stale.json()).toMatchObject({ code: ERROR_CODES.VERSION_CONFLICT })
    expect(await (await server.request(notePath(id))).json()).toMatchObject({ title: content.title.trim(), version: 2 })

    const forced = await server.request(
      notePath(id),
      body({ ...input, force: true, confirmedVersion: 2 }, HTTP_METHODS.PUT)
    )

    expect(await forced.json()).toMatchObject({ version: 3 })
  })

  it('should refuse a forced overwrite when the confirmed version is missing or outdated', async () => {
    const content = createContent()
    const { id } = noteSchema.parse(await (await server.request(collection, body(content))).json())
    const input = { ...content, baseVersion: 1 }

    await server.request(notePath(id), body(input, HTTP_METHODS.PUT))
    await server.request(notePath(id), body({ ...input, baseVersion: 2 }, HTTP_METHODS.PUT))

    const unconfirmed = await server.request(notePath(id), body({ ...input, force: true }, HTTP_METHODS.PUT))

    const outdated = await server.request(
      notePath(id),
      body({ ...input, force: true, confirmedVersion: 2 }, HTTP_METHODS.PUT)
    )

    expect(unconfirmed.status).toBe(HTTP_STATUS.CONFLICT)
    expect(outdated.status).toBe(HTTP_STATUS.CONFLICT)
    expect(await (await server.request(notePath(id))).json()).toMatchObject({ version: 3 })
  })

  it('should keep deletion idempotent when a note has an editing draft', async () => {
    const note = noteSchema.parse(await (await server.request(collection, body(createContent()))).json())
    const draft = { ...createNewDraft(), noteId: note.id, baseVersion: note.version }

    expect((await server.request(draftPath(note.id), body({ draft }, HTTP_METHODS.PUT))).status).toBe(
      HTTP_STATUS.NO_CONTENT
    )

    const remove = () =>
      server.request(notePath(note.id), {
        method: HTTP_METHODS.DELETE,
        headers: { 'content-type': 'application/json' }
      })

    expect((await remove()).status).toBe(HTTP_STATUS.NO_CONTENT)
    expect((await remove()).status).toBe(HTTP_STATUS.NO_CONTENT)
    expect(await (await server.request(draftPath(note.id))).json()).toBeNull()
  })

  it('should refuse to save a note or its draft when the note was deleted', async () => {
    const content = createContent()
    const note = noteSchema.parse(await (await server.request(collection, body(content))).json())
    const draft = { ...createNewDraft(), noteId: note.id, baseVersion: note.version }

    await server.request(notePath(note.id), { method: HTTP_METHODS.DELETE })

    const saved = await server.request(notePath(note.id), body({ ...content, baseVersion: 1 }, HTTP_METHODS.PUT))
    const drafted = await server.request(draftPath(note.id), body({ draft }, HTTP_METHODS.PUT))

    expect(saved.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect(await saved.json()).toMatchObject({ code: ERROR_CODES.NOTE_NOT_FOUND })
    expect(drafted.status).toBe(HTTP_STATUS.NOT_FOUND)
    expect((await server.request(notePath(note.id))).status).toBe(HTTP_STATUS.NOT_FOUND)
  })

  it('should accept a stale draft only when the newer note version is marked as observed', async () => {
    const content = createContent()
    const note = noteSchema.parse(await (await server.request(collection, body(content))).json())
    const draft = { ...createNewDraft(), noteId: note.id, baseVersion: 1 }

    await server.request(notePath(note.id), body({ ...content, baseVersion: 1 }, HTTP_METHODS.PUT))

    const stale = await server.request(draftPath(note.id), body({ draft }, HTTP_METHODS.PUT))
    const observed = await server.request(draftPath(note.id), body({ draft, observedVersion: 2 }, HTTP_METHODS.PUT))

    expect(stale.status).toBe(HTTP_STATUS.CONFLICT)
    expect(await stale.json()).toMatchObject({ code: ERROR_CODES.VERSION_CONFLICT })
    expect(observed.status).toBe(HTTP_STATUS.NO_CONTENT)
  })

  it('should accept the maximum title and todo lengths when saving', async () => {
    const input = { title: 'я'.repeat(TITLE_LIMIT), todos: [{ id: 'max', text: 'т'.repeat(TODO_LIMIT), done: true }] }
    const response = await server.request(collection, body(input))

    expect(response.status).toBe(HTTP_STATUS.CREATED)
    expect(await response.json()).toMatchObject(input)
  })

  it('should restore saved notes and drafts when restarting the built server', async () => {
    mkdirSync(TEST_TEMP_ROOT, { recursive: true })
    using directory = mkdtempDisposableSync(join(TEST_TEMP_ROOT, 'notes-restart-'))
    const path = join(directory.path, 'notes.sqlite')
    const legacy = openFirstRoundDatabase(path)
    const id = 'legacy-note'
    const draft = { ...createNewDraft(), noteId: id, baseVersion: 1 }

    try {
      legacy.$client.prepare('INSERT INTO notes VALUES (?, ?, ?, ?, ?)').run(id, 'План', 10, 10, 1)
      legacy.$client.prepare('INSERT INTO todos VALUES (?, ?, ?, ?, ?)').run('one', id, 0, 'Проверить', 1)
      legacy.$client.prepare('INSERT INTO drafts VALUES (?, ?, ?, ?)').run(id, 1, JSON.stringify(draft), draft.savedAt)
    } finally {
      legacy.$client.close()
    }

    let instance = await startTestServer(output, path)

    try {
      const note = noteSchema.parse(await (await instance.request(notePath(id))).json())

      expect(note).toMatchObject({ title: 'План', todos: [{ id: 'one', text: 'Проверить', done: true }] })
      expect(await (await instance.request(draftPath(id))).json()).toEqual(draft)
      await instance.close()
      instance = await startTestServer(output, path)
      expect(await (await instance.request(notePath(note.id))).json()).toEqual(note)
      expect(await (await instance.request(draftPath(note.id))).json()).toEqual(draft)
    } finally {
      await instance.close()
    }
  })

  it('should log a correlated internal error when a stored draft is unreadable', async () => {
    mkdirSync(TEST_TEMP_ROOT, { recursive: true })
    using directory = mkdtempDisposableSync(join(TEST_TEMP_ROOT, 'notes-draft-'))
    const path = join(directory.path, 'notes.sqlite')
    const instance = await startTestServer(output, path)
    const database = new Database(path)

    try {
      database
        .prepare('INSERT INTO drafts (key, payload, saved_at) VALUES (?, ?, ?)')
        .run(NEW_DRAFT_KEY, 'private draft', 1)

      const response = await instance.request(draftPath(NEW_DRAFT_KEY))
      const requestId = response.headers.get('x-request-id')

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(requestId).toEqual(expect.any(String))

      expect(await response.json()).toEqual({
        code: ERROR_CODES.DRAFT_UNREADABLE,
        category: ERROR_CATEGORIES.INTERNAL,
        requestId,
        message: expect.any(String)
      })

      await expect
        .poll(() =>
          instance
            .stdout()
            .split('\n')
            .map((line) => JSON.parse(line))
        )
        .toContainEqual(
          expect.objectContaining({
            level: 'error',
            msg: 'request.failed',
            code: ERROR_CODES.DRAFT_UNREADABLE,
            requestId
          })
        )

      expect(instance.stdout()).not.toContain('private draft')
    } finally {
      database.close()
      await instance.close()
    }
  })

  it.each(['/api/healthz', '/api/readyz'])('should return ok when probing %s', async (path) => {
    const response = await server.request(path)

    expect(response.status).toBe(HTTP_STATUS.OK)
    expect(await response.json()).toEqual({ status: 'ok' })
  })
})
