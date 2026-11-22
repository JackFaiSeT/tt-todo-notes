import { describe, expect, it } from 'vitest'
import { createError } from 'h3'
import { toApiFailure } from '#server/common/errors/handler'
import { ERROR_CODES, HTTP_STATUS } from '@shared/contract/http'

const sqliteError = (code: string): Error => Object.assign(new Error('sqlite'), { code })

describe('Server/ErrorHandler', () => {
  it.each(['SQLITE_BUSY', 'SQLITE_LOCKED', 'SQLITE_IOERR_WRITE', 'SQLITE_READONLY', 'SQLITE_FULL'])(
    'should report the database as unavailable when SQLite fails with %s',
    (code) => {
      const failure = toApiFailure(createError({ cause: sqliteError(code) }))

      expect(failure).toMatchObject({ status: HTTP_STATUS.SERVICE_UNAVAILABLE, code: ERROR_CODES.DATABASE_UNAVAILABLE })
    }
  )

  it.each([
    { name: 'a constraint violation', error: createError({ cause: sqliteError('SQLITE_CONSTRAINT_CHECK') }) },
    { name: 'a plain error', error: createError({ cause: new Error('boom') }) }
  ])('should report an internal error when the request fails with $name', ({ error }) => {
    expect(toApiFailure(error)).toMatchObject({
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR
    })
  })

  it('should report a missing route when the router finds no handler', () => {
    expect(toApiFailure(createError({ statusCode: HTTP_STATUS.NOT_FOUND }))).toMatchObject({
      code: ERROR_CODES.ROUTE_NOT_FOUND
    })
  })
})
