import { readFileSync } from 'node:fs'
import { exit } from 'node:process'
import { parse } from 'yaml'
import {
  findVersionMismatches,
  findVersionViolations,
  findWorkspaceVersionViolations
} from './lib/exact-versions-rules.mjs'
import { listRepoFiles } from './lib/repo-files.mjs'

const MANIFEST = /(^|\/)package\.json$/

const WORKSPACE_FILE = 'pnpm-workspace.yaml'

const manifests = listRepoFiles().filter((file) => MANIFEST.test(file))

const workspace = parse(readFileSync(WORKSPACE_FILE, 'utf8')) ?? {}

const parsedManifests = manifests.map((file) => ({ file, manifest: JSON.parse(readFileSync(file, 'utf8')) }))

const violations = [
  ...parsedManifests.flatMap(({ file, manifest }) => findVersionViolations(manifest, file)),
  ...findWorkspaceVersionViolations(workspace, WORKSPACE_FILE)
]

const nodeVersion = readFileSync('.nvmrc', 'utf8').trim()

const dockerfile = readFileSync('Dockerfile', 'utf8')

const image = /^ARG NODE_IMAGE=node:([0-9.]+)-[\w.-]+@sha256:[a-f0-9]{64}$/mu.exec(dockerfile)

const manifest = JSON.parse(readFileSync('package.json', 'utf8'))

const stages = Array.from(dockerfile.matchAll(/^FROM\s+(\S+)/gimu), (match) => match[1])

if (
  image?.[1] !== nodeVersion ||
  manifest.engines?.node !== nodeVersion ||
  !stages.length ||
  stages.some((base) => base !== '${NODE_IMAGE}')
) {
  console.error('Pin the same Node version in .nvmrc, engines.node and the Docker image digest')
  exit(1)
}

const mismatches = findVersionMismatches(parsedManifests)

if (mismatches.length > 0) {
  console.error(`Dependencies pinned to different versions across manifests: ${mismatches.length}`)

  for (const { name, entries } of mismatches) {
    console.error(
      `  ${name}: ${entries.map(({ file, section, version }) => `${file} › ${section} › ${version}`).join(', ')}`
    )
  }

  console.error(
    'Use one version of a dependency in every workspace manifest (scripts/checks/lib/exact-versions-rules.mjs)'
  )

  exit(1)
}

if (violations.length > 0) {
  console.error(`Dependencies without an exact version: ${violations.length}`)

  for (const { file, section, name, version } of violations) {
    console.error(`  ${file} › ${section} › ${name}: ${version}`)
  }

  console.error(
    'Pin every dependency, override and package extension to an exact version: pnpm add -E <name>@<version> (scripts/checks/lib/exact-versions-rules.mjs)'
  )

  exit(1)
}

console.log(`Dependencies use exact versions: ${manifests.length} manifests and ${WORKSPACE_FILE} checked`)
