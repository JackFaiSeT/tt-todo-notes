import { getQuery } from 'h3'
import { apiEndpoint } from '#server/common/http/endpoint'
import { parseInput } from '#server/common/validation/parse-input'
import { listQuerySchema } from '#server/modules/notes'

export default apiEndpoint((event) => event.context.notesService.list(parseInput(listQuerySchema, getQuery(event))))
