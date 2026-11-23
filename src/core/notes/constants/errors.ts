import { ERROR_CODES } from '@shared/contract/http'
import type { ErrorCode } from '@shared/contract/http'

export const NOTES_ERROR_TEXTS: Readonly<Record<ErrorCode, string>> = {
  [ERROR_CODES.FORBIDDEN]: 'Сервер отклонил запрос с этого адреса.',
  [ERROR_CODES.UNSUPPORTED_MEDIA_TYPE]: 'Сервер ожидает данные в формате JSON.',
  [ERROR_CODES.NOTE_NOT_FOUND]: 'Заметка удалена или не найдена.',
  [ERROR_CODES.VERSION_CONFLICT]: 'В другой вкладке сохранена новая версия заметки.',
  [ERROR_CODES.VALIDATION_FAILED]: 'Проверьте введённые данные.',
  [ERROR_CODES.DRAFT_UNREADABLE]: 'Не удалось прочитать черновик. Сохранённая заметка доступна для редактирования.',
  [ERROR_CODES.PAYLOAD_TOO_LARGE]: 'Размер запроса превышает допустимый предел.',
  [ERROR_CODES.ROUTE_NOT_FOUND]: 'Адрес запроса не найден.',
  [ERROR_CODES.DATABASE_UNAVAILABLE]: 'База данных временно недоступна.',
  [ERROR_CODES.INTERNAL_ERROR]: 'Серверу не удалось выполнить запрос. Попробуйте ещё раз.'
}

export const NOTES_FAILURE_TEXTS = {
  NETWORK: 'Нет связи с сервером. Проверьте соединение и повторите попытку.',
  UNKNOWN: 'Не удалось выполнить запрос. Попробуйте ещё раз.',
  REQUEST_ID: (requestId: string): string => ` Код запроса: ${requestId}.`
} as const

export const NOTES_CONTRACT_VIOLATIONS = {
  PAGE: 'Некорректная страница заметок.',
  BASE_VERSION: 'Отсутствует исходная версия заметки.'
} as const
