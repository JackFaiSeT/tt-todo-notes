import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))

export const listFiles = (directory) =>
  readdirSync(join(ROOT, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const path = directory ? `${directory}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        return listFiles(path)
      }

      return entry.isFile() ? [path] : []
    })
    .sort()
