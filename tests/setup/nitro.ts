import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { promisify } from 'node:util'

export const buildTestServer = async (directory: string): Promise<string> => {
  if (process.env.NOTES_TEST_OUTPUT) {
    return resolve(process.env.NOTES_TEST_OUTPUT)
  }

  const buildRoot = resolve(directory)

  await promisify(execFile)(process.execPath, ['node_modules/nuxt/bin/nuxt.mjs', 'build'], {
    windowsHide: true,
    env: { ...process.env, NOTES_TEST_BUILD_ROOT: buildRoot }
  })

  return join(buildRoot, 'output')
}

export const startTestServer = async (outputDirectory: string, databasePath = ':memory:', port = '0') => {
  const child = spawn(process.execPath, [join(outputDirectory, 'server/index.mjs')], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      NITRO_HOST: '127.0.0.1',
      NUXT_ALLOWED_HOST: 'notes.example.test',
      NITRO_PORT: port,
      NUXT_DATABASE_PATH: databasePath
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  })

  const exit = once(child, 'exit')
  const lines: string[] = []
  let stderr = ''

  child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
    stderr += chunk
  })

  const output = createInterface({ input: child.stdout })

  let deadline: ReturnType<typeof setTimeout> | undefined

  const startupTimeout = new Promise<never>((_resolve, reject) => {
    deadline = setTimeout(() => reject(new Error('Nitro startup timed out: ' + stderr)), 30_000)
  })

  const listening = new Promise<URL>((resolve) => {
    output.on('line', (line: string) => {
      const address = /^Listening on (http:\/\/\S+)/u.exec(line)?.[1]

      if (address) {
        resolve(new URL(address))
      } else {
        lines.push(line)
      }
    })
  })

  try {
    const address = await Promise.race([
      listening,
      startupTimeout,
      exit.then(([code]) => {
        throw new Error('Nitro exited during startup (' + code + '): ' + [...lines, stderr].join('\n'))
      })
    ])

    return {
      address,
      request: (path: string, options?: RequestInit) => fetch(new URL(path, address), options),
      stdout: () => lines.join('\n'),
      close: async (): Promise<void> => {
        child.kill()
        await exit
      }
    }
  } catch (error) {
    child.kill()
    await exit
    throw error
  } finally {
    clearTimeout(deadline)
  }
}
