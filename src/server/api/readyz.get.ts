import { HEALTH_RESPONSE } from '#server/common/http/constants'
import { apiEndpoint } from '#server/common/http/endpoint'

export default apiEndpoint((event) => {
  event.context.checkDatabase()

  return HEALTH_RESPONSE
})
