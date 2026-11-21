import type { ValueOf } from '@shared/contract/types'
import type { ErrorCode, ErrorEnvelope, HTTP_METHODS } from '@shared/contract/http'
import type { HTTP_ERROR_KINDS } from '@shared/constants/http'

export type HttpErrorKind = ValueOf<typeof HTTP_ERROR_KINDS>

export type HttpMethod = ValueOf<typeof HTTP_METHODS>

export type HttpQuery = Record<string, string | number>

export type HttpFieldErrors = ErrorEnvelope['fieldErrors']

export type HttpFailure = {
  kind: HttpErrorKind
  status: number
  code?: ErrorCode
  requestId?: string
  fieldErrors?: HttpFieldErrors
}

export type ReadOptions = {
  signal?: AbortSignal | undefined
}

type SendOptions = ReadOptions & {
  keepalive?: boolean
  query?: HttpQuery
}

type AbsentBody = {
  body?: never
}

type RequiredBody<TBody> = {
  body: TBody
}

type AbsentParams = {
  params?: never
}

type RequiredParams<TParams> = {
  params: TParams
}

type BodyOption<TBody> = [TBody] extends [never] ? AbsentBody : RequiredBody<TBody>

type ParamsOption<TParams> = [TParams] extends [never] ? AbsentParams : RequiredParams<TParams>

export type RequestOptions<TBody, TParams> = SendOptions & BodyOption<TBody> & ParamsOption<TParams>

export type RequestArgs<TBody, TParams> = [TBody | TParams] extends [never]
  ? [options?: RequestOptions<TBody, TParams>]
  : [options: RequestOptions<TBody, TParams>]

export type Endpoint<TResult, TBody, TParams> = {
  method: HttpMethod
  path: string
  readonly result?: TResult
  readonly options?: RequestOptions<TBody, TParams>
}

export type HttpTransportOptions = ReadOptions & {
  method: HttpMethod
  keepalive: boolean
  query?: HttpQuery
  body?: object
}

export type HttpTransport = <TResult>(url: string, options: HttpTransportOptions) => Promise<TResult>

export interface IHttpClient {
  request<TResult, TBody extends object, TParams extends Record<string, string>>(
    endpoint: Endpoint<TResult, TBody, TParams>,
    ...args: RequestArgs<NoInfer<TBody>, NoInfer<TParams>>
  ): Promise<TResult>
}
