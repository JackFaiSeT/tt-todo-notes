import { createHash } from 'node:crypto'
import { uneval } from 'devalue'
import { SERVER_HEADERS } from '#server/common/http/headers'

const SCRIPT_SOURCE = "script-src 'self'"

const HASH_ALGORITHM = 'sha256'

const NUXT_BOOTSTRAP_PREFIX = 'window.__NUXT__={};window.__NUXT__.config='

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response, { event }) => {
    if (!response.headers) {
      return
    }

    Reflect.deleteProperty(response.headers, SERVER_HEADERS.POWERED_BY)

    const policy = getRouteRules(event).headers?.[SERVER_HEADERS.CONTENT_SECURITY_POLICY]

    if (typeof policy !== 'string') {
      return
    }

    const config = useRuntimeConfig(event)
    const bootstrap = NUXT_BOOTSTRAP_PREFIX + uneval({ public: config.public, app: config.app })
    const hash = createHash(HASH_ALGORITHM).update(bootstrap).digest('base64')

    response.headers[SERVER_HEADERS.CONTENT_SECURITY_POLICY] = policy.replace(
      SCRIPT_SOURCE,
      `${SCRIPT_SOURCE} '${HASH_ALGORITHM}-${hash}'`
    )
  })
})
