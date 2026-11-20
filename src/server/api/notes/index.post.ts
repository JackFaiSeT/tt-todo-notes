import { readJsonBody } from '#server/common/http/body'
import { apiEndpoint } from '#server/common/http/endpoint'
import { parseInput } from '#server/common/validation/parse-input'
import { createNoteSchema } from '#server/modules/notes'
import { HTTP_STATUS } from '@shared/contract/http'

export default apiEndpoint(
  async (event) => event.context.notesService.create(parseInput(createNoteSchema, await readJsonBody(event))),
  HTTP_STATUS.CREATED
)
