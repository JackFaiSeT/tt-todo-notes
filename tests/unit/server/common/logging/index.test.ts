import { describe, expect, it } from 'vitest'
import { createLogger } from '#server/common/logging'

describe('Server/Logger', () => {
  it('should mask credentials and private note data when writing a JSON record', () => {
    const lines: string[] = []
    const logger = createLogger({ write: (line) => lines.push(line) })

    logger.info(
      {
        req: { headers: { Authorization: 'private bearer', cookie: 'private cookie', 'x-api-key': 'private key' } },
        res: { headers: { 'set-cookie': 'private cookie' } },
        user: { email: 'private email', password: 'private password', accessToken: 'private token' },
        body: { title: 'private title' },
        changes: [{ draft: { content: { todos: [{ text: 'private todo' }] } } }],
        method: 'PUT'
      },
      'request.received'
    )

    expect(lines).toHaveLength(1)

    expect(JSON.parse(lines[0]!)).toMatchObject({
      level: 'info',
      msg: 'request.received',
      method: 'PUT',
      req: { headers: { Authorization: '[Redacted]', cookie: '[Redacted]', 'x-api-key': '[Redacted]' } },
      res: { headers: { 'set-cookie': '[Redacted]' } },
      user: { email: '[Redacted]', password: '[Redacted]', accessToken: '[Redacted]' },
      body: '[Redacted]',
      changes: [{ draft: { content: { todos: [{ text: '[Redacted]' }] } } }]
    })

    expect(lines[0]).not.toContain('private')
  })
})
