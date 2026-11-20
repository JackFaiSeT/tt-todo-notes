import { getRouterParams } from 'h3'
import { apiEndpoint } from '#server/common/http/endpoint'
import { parseInput } from '#server/common/validation/parse-input'
import { draftParamsSchema } from '#server/modules/notes'
import { HTTP_STATUS } from '@shared/contract/http'

export default apiEndpoint(
  (event) => event.context.notesService.removeDraft(parseInput(draftParamsSchema, getRouterParams(event)).key),
  HTTP_STATUS.NO_CONTENT
)
