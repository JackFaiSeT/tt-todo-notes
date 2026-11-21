import { HTTP_CLIENT_TEXTS, HTTP_PATH_PARAMETER_PATTERN } from '@shared/constants/http'
import type { Endpoint, HttpMethod } from './types'

export const defineEndpoint = <TResult, TBody extends object = never, TParams extends Record<string, string> = never>(
  method: HttpMethod,
  path: string
): Endpoint<TResult, TBody, TParams> => ({ method, path })

export const toEndpointUrl = (path: string, params: Record<string, string> | undefined): string =>
  path.replace(HTTP_PATH_PARAMETER_PATTERN, (_match, key: string) => {
    const value = params?.[key]

    if (value === undefined) {
      throw new TypeError(HTTP_CLIENT_TEXTS.MISSING_PATH_PARAMETER)
    }

    return encodeURIComponent(value)
  })

export const toBodySize = (body: object | undefined): number =>
  body ? new TextEncoder().encode(JSON.stringify(body)).byteLength : 0
