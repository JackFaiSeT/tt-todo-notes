import type { Logger } from 'pino'
import type { DatabaseProbe } from '#server/database/probe'
import type { INotesService } from '#server/modules/notes'

declare module 'h3' {
  interface H3EventContext {
    logger: Logger
    notesService: INotesService
    checkDatabase: DatabaseProbe
    requestId?: string
  }
}
