import { getRouterParams } from 'h3'
import { apiEndpoint } from '#server/common/http/endpoint'
import { parseInput } from '#server/common/validation/parse-input'
import { noteParamsSchema } from '#server/modules/notes'
import { HTTP_STATUS } from '@shared/contract/http'

export default apiEndpoint(
  (event) => event.context.notesService.remove(parseInput(noteParamsSchema, getRouterParams(event)).id),
  HTTP_STATUS.NO_CONTENT
)
