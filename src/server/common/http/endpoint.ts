import { createError, defineEventHandler, send, setResponseStatus } from 'h3'
import type { EventHandler, EventHandlerRequest, H3Event } from 'h3'
import { withRequestContext } from '#server/common/request-context'
import { ApiError } from '#server/common/errors/api-error'
import { HTTP_STATUS } from '@shared/contract/http'
import type { HttpStatus } from '@shared/contract/http'
import { JSON_CONTENT_TYPE, JSON_NULL } from './constants'

export const apiEndpoint = <T>(
  handle: (event: H3Event) => T,
  status: HttpStatus = HTTP_STATUS.OK
): EventHandler<EventHandlerRequest, Promise<Awaited<T> | undefined>> =>
  defineEventHandler((event) =>
    withRequestContext(event, async () => {
      let result: Awaited<T>

      try {
        result = await handle(event)
      } catch (cause) {
        if (cause instanceof ApiError) {
          throw createError({ statusCode: cause.status, cause })
        }

        throw cause
      }

      setResponseStatus(event, status)

      if (result === null) {
        await send(event, JSON_NULL, JSON_CONTENT_TYPE)

        return undefined
      }

      return result
    })
  )
