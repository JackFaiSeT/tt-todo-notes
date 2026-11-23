import { getRouterParams } from 'h3'
import { readJsonBody } from '#server/common/http/body'
import { apiEndpoint } from '#server/common/http/endpoint'
import { parseInput } from '#server/common/validation/parse-input'
import { draftParamsSchema, putDraftSchema } from '#server/modules/notes'
import { HTTP_STATUS } from '@shared/contract/http'

export default apiEndpoint(
  async (event) =>
    event.context.notesService.putDraft(
      parseInput(draftParamsSchema, getRouterParams(event)).key,
      parseInput(putDraftSchema, await readJsonBody(event))
    ),
  HTTP_STATUS.NO_CONTENT
)
