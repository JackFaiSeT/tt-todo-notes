import { HTTP_STATUS } from '@shared/contract/http'

export const useMissingRoutePage = (): never => {
  throw createError({ statusCode: HTTP_STATUS.NOT_FOUND, fatal: true })
}
