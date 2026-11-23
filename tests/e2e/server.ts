import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import type { FullConfig } from '@playwright/test'
import { buildTestServer, startTestServer } from '@setup/nitro'
import { TEST_TEMP_ROOT } from '@setup/paths'

const start = async (config: FullConfig) => {
  const endpoint = new URL(config.projects[0]!.use.baseURL!)

  await mkdir(TEST_TEMP_ROOT, { recursive: true })

  const directory = await mkdtemp(join(TEST_TEMP_ROOT, 'e2e-'))
  let server: Awaited<ReturnType<typeof startTestServer>> | undefined

  const close = async () => {
    try {
      await server?.close()
    } finally {
      await rm(directory, { recursive: true, force: true, maxRetries: 5 })
    }
  }

  try {
    const output = await buildTestServer(directory)

    process.env.NOTES_TEST_OUTPUT = output
    server = await startTestServer(output, join(directory, 'notes.sqlite'), endpoint.port)

    const timeout = AbortSignal.timeout(30_000)

    while (!timeout.aborted) {
      const response = await server.request('/api/readyz', { signal: timeout }).catch(() => undefined)

      if (response?.ok) {
        return close
      }

      await delay(100)
    }

    throw new Error('Timed out waiting for /api/readyz')
  } catch (error) {
    await close()
    throw error
  }
}

export default start
