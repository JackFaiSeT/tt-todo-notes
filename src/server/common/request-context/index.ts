import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import { getHeader, setResponseHeaders } from 'h3'
import type { H3Event } from 'h3'
import { API_RESPONSE_HEADERS, REQUEST_ID_PATTERN } from '#server/common/http/constants'
import { HTTP_HEADERS } from '@shared/contract/http'

type RequestContext = {
  requestId: string
}

const storage = new AsyncLocalStorage<RequestContext>()

export const currentRequestId = (): string | undefined => storage.getStore()?.requestId

export const withRequestContext = <T>(event: H3Event, handle: (context: RequestContext) => T): T => {
  const incoming = getHeader(event, HTTP_HEADERS.REQUEST_ID)

  const requestId = event.context.requestId ?? (incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID())

  event.context.requestId = requestId

  setResponseHeaders(event, { ...API_RESPONSE_HEADERS, [HTTP_HEADERS.REQUEST_ID]: requestId })

  return storage.run({ requestId }, handle, { requestId })
}
