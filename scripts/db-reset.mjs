import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import Database from 'better-sqlite3'

const path = resolve(process.env.NUXT_DATABASE_PATH ?? '.data/notes.sqlite')

if (existsSync(path)) {
  const database = new Database(path, { fileMustExist: true })

  try {
    database.pragma('foreign_keys = ON')

    database
      .transaction(() => {
        database.prepare('DELETE FROM drafts').run()
        database.prepare('DELETE FROM todos').run()
        database.prepare('DELETE FROM notes').run()
      })
      .immediate()

    database.exec('VACUUM')
  } finally {
    database.close()
  }
}
