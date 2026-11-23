import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { failCheck, passCheck } from './lib/check-output.mjs'
import { readFrontendScripts } from './lib/frontend-sources.mjs'
import {
  COMPOSITION_ENTRY,
  COMPOSITION_ROOT,
  CORE_ROOT,
  createLayerRules,
  findDomainOrderGaps
} from './lib/layer-rules.mjs'
import { findPresentationViolations, findStyleViolations } from './lib/presentation-rules.mjs'
import { ROOT } from './lib/repo-files.mjs'

const readDomains = () => {
  try {
    return readdirSync(join(ROOT, CORE_ROOT), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch {
    return []
  }
}

const DOMAIN_ORDER_FILE = 'config/domain-order.mjs'

const readDomainOrder = async () => {
  const file = join(ROOT, DOMAIN_ORDER_FILE)

  return existsSync(file) ? [...(await import(pathToFileURL(file).href)).DOMAIN_ORDER] : []
}

const VIOLATION_MESSAGES = {
  placement: (location) => location + ': shared domain contracts belong in src/shared/contract',
  forbidden: (location, { specifier }) => location + ' imports ' + specifier + ' across its ownership boundary',
  layer: (location, { fileLayer, specifier, targetLayer }) =>
    `${location} [${fileLayer}] → ${specifier} [${targetLayer}]`,
  domain: (location, { specifier }) =>
    `${location} → ${specifier}: a domain reaches another domain only through @<domain> or its framework-free /domain entry`,
  app: (location, { specifier }) =>
    `${location} → ${specifier}: src/app takes a domain only through @<domain> and @<domain>/components; @<domain>/${COMPOSITION_ENTRY} belongs to ${COMPOSITION_ROOT}`,
  order: (location, { specifier, fileDomain, targetDomain }) =>
    `${location} → ${specifier}: domain ${fileDomain} is more general than ${targetDomain} in ${DOMAIN_ORDER_FILE} and does not depend on it`,
  barrel: (location, { specifier }) =>
    `${location} → ${specifier}: a domain entry does not re-export components; other layers import them from @<domain>/components`,
  server: (location, { specifier }) =>
    `${location} → ${specifier}: routes and plugins use module entries, common and database stay independent of modules, modules do not import routes or plugins, and client and server share only the contract`,
  data: (location, { specifier }) =>
    `${location} → ${specifier}: drizzle-orm, better-sqlite3, the database connection and the schema belong to repositories, *.module.ts, src/server/database and src/server/plugins`
}

const violations = []

let checked = 0

const domains = readDomains()

const domainOrder = await readDomainOrder()

const { missing, unknown } = findDomainOrderGaps(domains, domainOrder)

violations.push(
  ...missing.map((domain) => `${DOMAIN_ORDER_FILE}: domain ${domain} is missing from DOMAIN_ORDER`),
  ...unknown.map((domain) => `${DOMAIN_ORDER_FILE}: ${domain} is not a folder of ${CORE_ROOT}`)
)

const { isLayeredFile, findImportViolations, resolveTarget } = createLayerRules(domains, domainOrder)

const entries = readFrontendScripts()

violations.push(...findPresentationViolations(entries, resolveTarget))

for (const entry of entries) {
  if (!isLayeredFile(entry.file)) {
    continue
  }

  checked += 1

  violations.push(
    ...findStyleViolations(entry, (path) =>
      existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), 'utf8') : undefined
    )
  )

  for (const [kind, found] of Object.entries(findImportViolations(entry.file, entry.source))) {
    violations.push(...found.map((violation) => VIOLATION_MESSAGES[kind](entry.file, violation)))
  }
}

if (violations.length > 0) {
  failCheck('Layer violations', violations, [
    'Allowed direction: @shared/contract → @base → @uikit → @shared → core/<domain> → @app; a layer imports only the layers to its left'
  ])
}

passCheck(`Layers clean: ${checked} files checked`)
