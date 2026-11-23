import { randomUUID } from 'node:crypto'
import { expect, test as base } from '@playwright/test'
import type { BrowserContext, ConsoleMessage, Page, Response, WebError } from '@playwright/test'
import { HTTP_METHODS, HTTP_STATUS } from '@shared/contract/http'
import type { HttpStatus } from '@shared/contract/http'
import { NOTES_PATHS } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import type { DraftKey, NoteId } from '@shared/contract/notes/ids'

type ChecklistItem = {
  id: string
  text: string
  done: boolean
}

type Fixtures = {
  createNote: (title: string, todos?: ChecklistItem[]) => Promise<NoteId>
  consoleGuard: {
    allowHttpError: (path: string, status: HttpStatus) => void
  }
}

export const uniqueTitle = (label: string): string => label + ' ' + randomUUID()

export const noteEndpoint = (id: NoteId): string => NOTES_PATHS.NOTE.replace(':id', id)

export const draftEndpoint = (key: DraftKey): string => NOTES_PATHS.DRAFT.replace(':key', key)

export const failDraftWrites = async (target: Page | BrowserContext, key: DraftKey): Promise<void> => {
  await target.route(
    (url) => url.pathname === draftEndpoint(key),
    (route) =>
      route.request().method() === HTTP_METHODS.PUT
        ? route.fulfill({ status: HTTP_STATUS.SERVICE_UNAVAILABLE, json: {} })
        : route.continue()
  )
}

export const isDraftWrite =
  (key: DraftKey) =>
  (response: Response): boolean =>
    new URL(response.url()).pathname === draftEndpoint(key) && response.request().method() === HTTP_METHODS.PUT

export const test = base.extend<Fixtures>({
  createNote: async ({ request }, use) => {
    await use(async (title, todos = []) => {
      const response = await request.post(NOTES_PATHS.COLLECTION, { data: { title, todos } })

      expect(response.status()).toBe(HTTP_STATUS.CREATED)

      return parseNoteId((await response.json()).id)
    })
  },
  consoleGuard: [
    async ({ context, baseURL }, use) => {
      const errors: string[] = []
      const allowed = new Map<string, Set<HttpStatus>>()

      const onConsole = (message: ConsoleMessage) => {
        if (message.type() !== 'error') {
          return
        }

        const url = message.location().url

        const status = /^Failed to load resource: the server responded with a status of (\d+)\b/u.exec(
          message.text()
        )?.[1]

        if (status && allowed.get(url)?.has(Number(status) as HttpStatus)) {
          return
        }

        errors.push(url + ' ' + message.text())
      }

      const onPageError = (event: WebError) => errors.push(event.error().stack ?? event.error().message)

      context.on('console', onConsole)
      context.on('weberror', onPageError)

      try {
        await use({
          allowHttpError: (path, status) => {
            const url = new URL(path, baseURL).href
            const statuses = allowed.get(url) ?? new Set<HttpStatus>()

            statuses.add(status)
            allowed.set(url, statuses)
          }
        })
      } finally {
        context.off('console', onConsole)
        context.off('weberror', onPageError)
        expect(errors, 'Browser console and uncaught page errors').toEqual([])
      }
    },
    { auto: true }
  ]
})

export { expect }
