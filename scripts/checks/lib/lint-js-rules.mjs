const CACHE_ROOT = '.dev-artifacts/cache/eslint'

export const LINT_JS_PARTS = Object.freeze([
  { name: 'server', targets: ['src/server'], ignores: [] },
  { name: 'rest', targets: ['.'], ignores: ['src/server/**'] }
])

export const eslintArgsOf = ({ name, targets, ignores, config }, extraArgs = []) => [
  ...targets,
  ...(config === undefined ? [] : ['--config', config]),
  '--max-warnings',
  '0',
  '--cache',
  '--cache-location',
  `${CACHE_ROOT}/${name}/`,
  ...ignores.flatMap((pattern) => ['--ignore-pattern', pattern]),
  ...extraArgs
]
