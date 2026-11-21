import { BODY_BYTES_MAX, ERROR_CODES, HTTP_STATUS } from '@shared/contract/http'
import { HTTP_ERROR_KINDS, HTTP_KEEPALIVE_BYTES_MAX } from '@shared/constants/http'
import type { IErrorReporter } from '@shared/services/error-reporter'
import type { Endpoint, HttpTransport, IHttpClient, RequestArgs } from './types'
import { toBodySize, toEndpointUrl } from './endpoint'
import { HttpError, toHttpError } from './errors'

export class HttpClient implements IHttpClient {
  constructor(
    private readonly httpTransport: HttpTransport,
    private readonly errorReporter: IErrorReporter
  ) {}

  async request<TResult, TBody extends object, TParams extends Record<string, string>>(
    endpoint: Endpoint<TResult, TBody, TParams>,
    ...args: RequestArgs<NoInfer<TBody>, NoInfer<TParams>>
  ): Promise<TResult> {
    const [options] = args
    const url = toEndpointUrl(endpoint.path, options?.params)
    const body = options?.body
    const bodySize = toBodySize(body)

    if (bodySize > BODY_BYTES_MAX) {
      throw new HttpError({
        kind: HTTP_ERROR_KINDS.REQUEST,
        status: HTTP_STATUS.PAYLOAD_TOO_LARGE,
        code: ERROR_CODES.PAYLOAD_TOO_LARGE
      })
    }

    try {
      return await this.httpTransport<TResult>(url, {
        method: endpoint.method,
        ...(body && { body }),
        ...(options?.query && { query: options.query }),
        ...(options?.signal && { signal: options.signal }),
        keepalive: Boolean(options?.keepalive) && bodySize <= HTTP_KEEPALIVE_BYTES_MAX
      })
    } catch (error) {
      if (options?.signal?.aborted) {
        throw error
      }

      const failure = toHttpError(error)

      this.errorReporter.report(failure, `${endpoint.method} ${endpoint.path}`)

      throw failure
    }
  }
}
