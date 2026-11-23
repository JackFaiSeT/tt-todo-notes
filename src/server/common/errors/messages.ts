import { BODY_BYTES_MAX, JSON_MEDIA_TYPE } from '@shared/contract/http'

export const COMMON_ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Проверьте данные запроса.',
  INVALID_JSON: 'Некорректный JSON.',
  PAYLOAD_TOO_LARGE: `Размер запроса превышает ${BODY_BYTES_MAX} байт.`,
  ROUTE_NOT_FOUND: 'Маршрут не найден.',
  DATABASE_UNAVAILABLE: 'База данных недоступна.',
  INTERNAL_ERROR: 'Серверу не удалось выполнить запрос. Попробуйте ещё раз.',
  FORBIDDEN: 'Запрос отклонён.',
  UNSUPPORTED_MEDIA_TYPE: `Требуется Content-Type ${JSON_MEDIA_TYPE}.`
} as const

export const BODY_ERROR_FIELD = '$'

export const API_ERROR_NAME = 'ApiError'
