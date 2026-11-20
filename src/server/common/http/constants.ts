import { API_PREFIX, HTTP_METHODS, JSON_MEDIA_TYPE } from '@shared/contract/http'
import { SERVER_HEADERS } from './headers'

export const API_ROUTE_PATTERN = new RegExp(`^${API_PREFIX}(?:[/?]|$)`, 'iu')

export const HOST_PATTERN = /^(\[[0-9a-f:]+\]|[a-z0-9.-]+)(?::\d{1,5})?$/u

export const REQUEST_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/u

export const LOCAL_HOSTS: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]'])

export const SAFE_METHODS: ReadonlySet<string> = new Set([HTTP_METHODS.GET, 'HEAD', 'OPTIONS'])

export const BODY_METHODS: ReadonlySet<string> = new Set([HTTP_METHODS.POST, HTTP_METHODS.PUT])

export const CROSS_SITE_FETCH = 'cross-site'

export const RETRY_AFTER_SECONDS = 1

export const DATABASE_UNAVAILABLE_PATTERN = /^SQLITE_(?:BUSY|LOCKED|IOERR|READONLY|CANTOPEN|FULL)(?:_|$)/u

export const CONNECTION_CLOSE = 'close'

export const JSON_CONTENT_TYPE = `${JSON_MEDIA_TYPE}; charset=utf-8`

export const JSON_NULL = 'null'

export const TEXT_ENCODING = 'utf-8'

export const API_RESPONSE_HEADERS = {
  [SERVER_HEADERS.CACHE_CONTROL]: 'no-store',
  [SERVER_HEADERS.CONTENT_TYPE_OPTIONS]: 'nosniff',
  [SERVER_HEADERS.FRAME_OPTIONS]: 'DENY',
  [SERVER_HEADERS.REFERRER_POLICY]: 'no-referrer'
} as const

export const HEALTH_RESPONSE = {
  status: 'ok'
} as const

export const UNMATCHED_ROUTE = 'unmatched'
