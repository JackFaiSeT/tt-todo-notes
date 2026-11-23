import { isApiRoute } from '#server/common/http/routes'
import { findApiError, handleApiError } from './handler'

export default defineNitroErrorHandler((error, event) => {
  if (isApiRoute(event.path) || findApiError(error)) {
    return handleApiError(error, event, event.context.logger)
  }
})
