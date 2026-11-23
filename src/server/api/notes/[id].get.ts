import { getRouterParams } from 'h3'
import { apiEndpoint } from '#server/common/http/endpoint'
import { parseInput } from '#server/common/validation/parse-input'
import { noteParamsSchema } from '#server/modules/notes'

export default apiEndpoint((event) =>
  event.context.notesService.get(parseInput(noteParamsSchema, getRouterParams(event)).id)
)
