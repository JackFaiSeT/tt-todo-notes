import { join } from 'node:path'

export const MIGRATIONS_DIRECTORY = 'migrations'

export const SOURCE_MIGRATIONS_PATH = join('src', 'server', 'database', MIGRATIONS_DIRECTORY)
