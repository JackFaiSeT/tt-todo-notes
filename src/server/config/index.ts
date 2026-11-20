import { z, ZodError } from 'zod'

export const ENV_KEYS = {
  DATABASE_PATH: 'NUXT_DATABASE_PATH',
  MIGRATIONS_PATH: 'NUXT_MIGRATIONS_PATH',
  ALLOWED_HOST: 'NUXT_ALLOWED_HOST',
  NODE_ENV: 'NODE_ENV'
} as const

export const MEMORY_DATABASE_PATH = ':memory:'

const TEST_ENVIRONMENT = 'test'

const ALLOWED_HOST_PATTERN = /^(?:[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[0-9a-f:]+\])?$/u

const MEMORY_DATABASE_MESSAGE = 'SQLite в памяти разрешена только в тестах.'

const configSchema = z
  .object({
    allowedHost: z.string().toLowerCase().regex(ALLOWED_HOST_PATTERN),
    databasePath: z.string().trim().min(1),
    migrationsPath: z.string().trim().min(1),
    environment: z.string().optional()
  })
  .refine((config) => config.databasePath !== MEMORY_DATABASE_PATH || config.environment === TEST_ENVIRONMENT, {
    path: ['databasePath'],
    message: MEMORY_DATABASE_MESSAGE
  })

export type ServerConfig = z.infer<typeof configSchema>

export type ServerConfigDefaults = Pick<ServerConfig, 'databasePath' | 'migrationsPath' | 'allowedHost'>

const ENV_KEY_BY_FIELD = {
  databasePath: ENV_KEYS.DATABASE_PATH,
  migrationsPath: ENV_KEYS.MIGRATIONS_PATH,
  allowedHost: ENV_KEYS.ALLOWED_HOST,
  environment: ENV_KEYS.NODE_ENV
} as const satisfies Record<keyof ServerConfig, string>

type ConfigField = keyof ServerConfig

const isConfigField = (value: unknown): value is ConfigField => typeof value === 'string' && value in ENV_KEY_BY_FIELD

const CONFIG_FIELDS = Object.keys(ENV_KEY_BY_FIELD).filter(isConfigField)

export const loadConfig = (defaults: ServerConfigDefaults, environment: NodeJS.ProcessEnv): ServerConfig => {
  const fallbacks: Partial<Record<ConfigField, string>> = defaults

  return configSchema.parse(
    Object.fromEntries(CONFIG_FIELDS.map((field) => [field, environment[ENV_KEY_BY_FIELD[field]] ?? fallbacks[field]]))
  )
}

export const toInvalidEnvKeys = (error: unknown): string[] | undefined => {
  if (!(error instanceof ZodError)) {
    return undefined
  }

  const keys = error.issues
    .map((issue) => issue.path[0])
    .filter(isConfigField)
    .map((field) => ENV_KEY_BY_FIELD[field])

  return [...new Set(keys)]
}
