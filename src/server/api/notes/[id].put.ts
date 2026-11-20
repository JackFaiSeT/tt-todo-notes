import { getRouterParams } from 'h3'
import { readJsonBody } from '#server/common/http/body'
import { apiEndpoint } from '#server/common/http/endpoint'
import { parseInput } from '#server/common/validation/parse-input'
import { noteParamsSchema, updateNoteSchema } from '#server/modules/notes'

export default apiEndpoint(async (event) =>
  event.context.notesService.update(
    parseInput(noteParamsSchema, getRouterParams(event)).id,
    parseInput(updateNoteSchema, await readJsonBody(event))
  )
)
