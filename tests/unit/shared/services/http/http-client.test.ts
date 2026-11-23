import { describe, expect, it, vi } from 'vitest'
import { HTTP_METHODS, HTTP_STATUS, ERROR_CODES, ERROR_CATEGORIES } from '@shared/contract/http'
import { HTTP_ERROR_KINDS } from '@shared/constants/http'
import { HttpClient, defineEndpoint } from '@shared/services/http'
import { createHttpTransport } from '../../../../factories/http-transport'

type DraftBody = {
  draft: string
}

const endpoint = defineEndpoint<undefined, DraftBody>(HTTP_METHODS.PUT, '/api/drafts/new')

describe('Shared/HttpClient', () => {
  it('should pass the abort signal to the transport when a read can be superseded', async () => {
    const { port, calls } = createHttpTransport()
    const { signal } = new AbortController()

    await new HttpClient(port.send, { report: vi.fn() }).request(defineEndpoint(HTTP_METHODS.GET, '/api/notes'), {
      signal
    })

    expect(calls.mock.calls[0]?.[1]).toHaveProperty('signal', signal)
  })

  it.each([
    [61441, false],
    [61440, true]
  ] as const)(
    'should apply the keepalive limit when the serialized body contains %i bytes',
    async (bytes, expected) => {
      const { port, calls } = createHttpTransport()
      const body = { draft: 'я' }

      body.draft += 'a'.repeat(bytes - Buffer.byteLength(JSON.stringify(body)))
      await new HttpClient(port.send, { report: vi.fn() }).request(endpoint, { body, keepalive: true })
      expect(calls).toHaveBeenCalledWith('/api/drafts/new', { method: HTTP_METHODS.PUT, body, keepalive: expected })
    }
  )

  it('should not request keepalive when the caller did not ask for it', async () => {
    const { port, calls } = createHttpTransport()
    const body = { draft: 'я' }

    await new HttpClient(port.send, { report: vi.fn() }).request(endpoint, { body })
    expect(calls).toHaveBeenCalledWith('/api/drafts/new', { method: HTTP_METHODS.PUT, body, keepalive: false })
  })

  it('should reject the serialized body when it exceeds one MiB', async () => {
    const { port, calls } = createHttpTransport()

    await expect(
      new HttpClient(port.send, { report: vi.fn() }).request(endpoint, { body: { draft: 'я'.repeat(524288) } })
    ).rejects.toMatchObject({ kind: HTTP_ERROR_KINDS.REQUEST, code: ERROR_CODES.PAYLOAD_TOO_LARGE })

    expect(calls).not.toHaveBeenCalled()
  })

  it('should preserve field errors and request ID when the server rejects input', async () => {
    const fieldErrors = { title: ['Обязательное поле'] }

    const { port, calls } = createHttpTransport()

    calls.mockRejectedValue({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      data: {
        category: ERROR_CATEGORIES.VALIDATION_FAILED,
        code: ERROR_CODES.VALIDATION_FAILED,
        fieldErrors,
        message: 'private',
        requestId: 'r1'
      }
    })

    await expect(
      new HttpClient(port.send, { report: vi.fn() }).request(endpoint, { body: { draft: 'test' } })
    ).rejects.toMatchObject({
      kind: HTTP_ERROR_KINDS.RESPONSE,
      code: ERROR_CODES.VALIDATION_FAILED,
      status: HTTP_STATUS.BAD_REQUEST,
      fieldErrors,
      requestId: 'r1'
    })
  })
})
