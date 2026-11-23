import { defineEventHandler, getHeader, getRequestProtocol } from 'h3'
import type { EventHandler, H3Event } from 'h3'
import { forbidden, unsupportedMediaType } from '#server/common/errors/common.errors'
import { HTTP_HEADERS, JSON_MEDIA_TYPE } from '@shared/contract/http'
import { BODY_METHODS, CROSS_SITE_FETCH, HOST_PATTERN, LOCAL_HOSTS, SAFE_METHODS } from './constants'
import { SERVER_HEADERS } from './headers'
import { isApiRoute } from './routes'

const isAllowedHost = (host: string, allowedHost: string): boolean => {
  const hostname = HOST_PATTERN.exec(host)?.[1]

  return Boolean(hostname) && (LOCAL_HOSTS.has(hostname ?? '') || hostname === allowedHost)
}

const isCrossSite = (event: H3Event, host: string): boolean => {
  const protocol = getRequestProtocol(event, { xForwardedProto: false })
  const origin = getHeader(event, SERVER_HEADERS.ORIGIN)

  return (
    getHeader(event, SERVER_HEADERS.SEC_FETCH_SITE) === CROSS_SITE_FETCH ||
    (origin !== undefined && origin !== URL.parse(`${protocol}://${host}`)?.origin)
  )
}

const hasBody = (event: H3Event): boolean =>
  BODY_METHODS.has(event.method) ||
  Number(getHeader(event, SERVER_HEADERS.CONTENT_LENGTH)) > 0 ||
  getHeader(event, SERVER_HEADERS.TRANSFER_ENCODING) !== undefined

const hasJsonContentType = (event: H3Event): boolean =>
  getHeader(event, HTTP_HEADERS.CONTENT_TYPE)?.split(';')[0]?.trim().toLowerCase() === JSON_MEDIA_TYPE

export const createRequestPolicy = (allowedHost: string): EventHandler =>
  defineEventHandler((event) => {
    const host = getHeader(event, SERVER_HEADERS.HOST)?.toLowerCase() ?? ''

    if (!isAllowedHost(host, allowedHost)) {
      throw forbidden()
    }

    if (SAFE_METHODS.has(event.method) || !isApiRoute(event.path)) {
      return
    }

    if (isCrossSite(event, host)) {
      throw forbidden()
    }

    if (hasBody(event) && !hasJsonContentType(event)) {
      throw unsupportedMediaType()
    }
  })
