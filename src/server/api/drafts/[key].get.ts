import { getRouterParams } from 'h3'
import { apiEndpoint } from '#server/common/http/endpoint'
import { parseInput } from '#server/common/validation/parse-input'
import { draftParamsSchema } from '#server/modules/notes'

export default apiEndpoint((event) =>
  event.context.notesService.draft(parseInput(draftParamsSchema, getRouterParams(event)).key)
)
