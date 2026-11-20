export const DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']

const EXACT_VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/

const WORKSPACE_PROTOCOL = 'workspace:*'

const SECTION_SEPARATOR = ' › '

const isAllowed = (version) => version === WORKSPACE_PROTOCOL || EXACT_VERSION.test(version)

const findSectionViolations = (versions, file, section) =>
  Object.entries(versions ?? {})
    .filter(([, version]) => !isAllowed(String(version)))
    .map(([name, version]) => ({ file, section, name, version }))

export const findVersionViolations = (manifest, file) =>
  DEPENDENCY_SECTIONS.flatMap((section) => findSectionViolations(manifest[section], file, section))

const findExtensionViolations = (selector, extension, file) =>
  DEPENDENCY_SECTIONS.flatMap((section) =>
    findSectionViolations(extension?.[section], file, ['packageExtensions', selector, section].join(SECTION_SEPARATOR))
  )

const pinnedEntriesOf = ({ file, manifest }) =>
  DEPENDENCY_SECTIONS.flatMap((section) =>
    Object.entries(manifest[section] ?? {})
      .filter(([, version]) => String(version) !== WORKSPACE_PROTOCOL)
      .map(([name, version]) => ({ name, file, section, version: String(version) }))
  )

export const findVersionMismatches = (manifests) => {
  const byName = new Map()

  for (const { name, ...entry } of manifests.flatMap(pinnedEntriesOf)) {
    byName.set(name, [...(byName.get(name) ?? []), entry])
  }

  return [...byName.entries()]
    .filter(([, entries]) => new Set(entries.map((entry) => entry.version)).size > 1)
    .map(([name, entries]) => ({ name, entries }))
}

export const findWorkspaceVersionViolations = (workspace, file) => [
  ...findSectionViolations(workspace.overrides, file, 'overrides'),
  ...Object.entries(workspace.packageExtensions ?? {}).flatMap(([selector, extension]) =>
    findExtensionViolations(selector, extension, file)
  )
]
