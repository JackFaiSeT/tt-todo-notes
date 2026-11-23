import { routeNotFound } from '#server/common/errors/common.errors'
import { apiEndpoint } from '#server/common/http/endpoint'

export default apiEndpoint(() => {
  throw routeNotFound()
})
