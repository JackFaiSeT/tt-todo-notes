import { isError } from 'h3'
import { createLogger, diagnosticFields } from '#server/common/logging'
import { findApiError } from '#server/common/errors/handler'
import { createRequestPolicy } from '#server/common/http/request-policy'
import { isApiRoute } from '#server/common/http/routes'
import { LOG_EVENTS } from '#server/common/logging/constants'
import { loadConfig, toInvalidEnvKeys } from '#server/config'
import { openDatabase } from '#server/database/connection'
import { migrateDatabase } from '#server/database/migrations'
import { createDatabaseProbe } from '#server/database/probe'
import { createNotesModule } from '#server/modules/notes'
import { HTTP_STATUS } from '@shared/contract/http'

const REQUEST_ERROR_TAG = 'request'

const ROOT_ROUTE = '/'

const isRequestError = (tags: unknown): boolean =>
  Array.isArray(tags) && tags.length === 1 && tags[0] === REQUEST_ERROR_TAG

export default defineNitroPlugin((nitro) => {
  const logger = createLogger()

  nitro.hooks.hook('error', (error, { event, tags }) => {
    if (isRequestError(tags) && event && (isApiRoute(event.path) || findApiError(error))) {
      return
    }

    if (isRequestError(tags) && isError(error) && error.statusCode < HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      logger.info({ tags, method: event?.method, status: error.statusCode }, LOG_EVENTS.NITRO_ERROR)

      return
    }

    logger.error(
      { ...diagnosticFields(error), tags, method: event?.method, route: event?.context.matchedRoute?.path },
      LOG_EVENTS.NITRO_ERROR
    )
  })

  try {
    const config = loadConfig(useRuntimeConfig(), process.env)
    const database = openDatabase(config.databasePath)

    try {
      migrateDatabase(database, config.migrationsPath)

      const notesService = createNotesModule(database)
      const checkDatabase = createDatabaseProbe(database)

      nitro.h3App.stack.unshift({ route: ROOT_ROUTE, handler: createRequestPolicy(config.allowedHost) })

      nitro.hooks.hook('request', (event) => {
        event.context.logger = logger
        event.context.notesService = notesService
        event.context.checkDatabase = checkDatabase
      })

      nitro.hooks.hook('close', () => database.$client.close())
      logger.info({}, LOG_EVENTS.DATABASE_READY)
    } catch (error) {
      database.$client.close()
      throw error
    }
  } catch (error) {
    logger.error({ ...diagnosticFields(error), configKeys: toInvalidEnvKeys(error) }, LOG_EVENTS.STARTUP_FAILED)
    throw error
  }
})
