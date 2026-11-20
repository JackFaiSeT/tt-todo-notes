import { createAppPaths } from './nuxt/app.mjs'

const { resolveAppPath, appAliases } = createAppPaths(new URL('../', import.meta.url))

export { resolveAppPath }

export const APP_ALIASES = appAliases

export const CONTRACT_ALIASES = { '@shared/contract': APP_ALIASES['@shared/contract'] }
