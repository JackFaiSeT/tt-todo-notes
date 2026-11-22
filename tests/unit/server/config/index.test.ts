import { describe, expect, it } from 'vitest'
import { loadConfig, toInvalidEnvKeys } from '#server/config'
import { SOURCE_MIGRATIONS_PATH } from '#server/config/migrations'

const defaults = { allowedHost: '', databasePath: 'notes.sqlite', migrationsPath: SOURCE_MIGRATIONS_PATH }

const rejectedKeys = (environment: NodeJS.ProcessEnv): string[] | undefined => {
  try {
    loadConfig(defaults, environment)

    return []
  } catch (error) {
    return toInvalidEnvKeys(error)
  }
}

describe('Server/Config', () => {
  it.each(['', '   '])('should reject an explicitly blank database path when starting', (path) => {
    expect(rejectedKeys({ NUXT_DATABASE_PATH: path })).toEqual(['NUXT_DATABASE_PATH'])
  })

  it('should reject an in-memory database when starting in production', () => {
    expect(rejectedKeys({ NUXT_DATABASE_PATH: ':memory:', NODE_ENV: 'production' })).toEqual(['NUXT_DATABASE_PATH'])
  })

  it('should use the configured migration directory when the deployment sets an override', () => {
    expect(loadConfig(defaults, { NUXT_MIGRATIONS_PATH: '/srv/migrations' }).migrationsPath).toBe('/srv/migrations')
  })
})
