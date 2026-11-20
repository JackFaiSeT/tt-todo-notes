import { readFileSync } from 'node:fs'
import { listRepoFiles } from './repo-files.mjs'
import { toScriptEntry } from './script-source.mjs'

const SOURCE_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.tsx', '.jsx', '.vue']

const FRONTEND_SOURCE_DIRECTORIES = ['src']

export const readFrontendScripts = () =>
  listRepoFiles(FRONTEND_SOURCE_DIRECTORIES)
    .filter((file) => SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension)))
    .map((file) => toScriptEntry(file, readFileSync(file, 'utf8')))
