import { HTTP_HEADERS, JSON_MEDIA_TYPE } from '@shared/contract/http'
import { HTTP_REQUEST_TIMEOUT_MS } from '@shared/constants/http'
import type { HttpTransport, HttpTransportOptions } from './types'

export const nuxtHttpTransport: HttpTransport = <TResult>(
  url: string,
  options: HttpTransportOptions
): Promise<TResult> =>
  $fetch<TResult, string>(url, {
    ...options,
    signal: options.signal ?? null,
    ...(options.body && { headers: { [HTTP_HEADERS.CONTENT_TYPE]: JSON_MEDIA_TYPE } }),
    timeout: HTTP_REQUEST_TIMEOUT_MS,
    retry: 0
  })
