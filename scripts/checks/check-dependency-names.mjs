import { readFileSync } from 'node:fs'
import { failCheck, passCheck } from './lib/check-output.mjs'
import { findDependencyNameViolations, MAX_CONSTRUCTOR_DEPENDENCIES } from './lib/dependency-names-rules.mjs'
import { listRepoFiles } from './lib/repo-files.mjs'

const SOURCE_ROOTS = ['src']

const SOURCE_FILE = /\.(ts|mts)$/

const TEST_FILE = /\.(spec|test)\.(ts|mts)$|\.d\.ts$/

const CONSTRUCTOR_LIMIT_EXCEPTIONS = Object.freeze({})

const files = listRepoFiles(SOURCE_ROOTS).filter((file) => SOURCE_FILE.test(file) && !TEST_FILE.test(file))

const violations = files.flatMap((file) =>
  findDependencyNameViolations({ file, source: readFileSync(file, 'utf8'), limits: CONSTRUCTOR_LIMIT_EXCEPTIONS })
)

const describeViolation = (violation) =>
  violation.kind === 'limit'
    ? `${violation.file}:${violation.line} ${violation.className} has ${violation.count} constructor dependencies`
    : `${violation.file}:${violation.line} ${violation.className}: ${violation.name} must be ${violation.expected.join(' or ')}`

if (violations.length > 0) {
  failCheck('Constructor dependency names and limit', violations.map(describeViolation), [
    'A dependency is named after its type in camelCase without the I prefix: ordersRepository: OrdersRepository',
    'A dependency injected by a token may be named after the token: @Inject(BILLING_QUEUE) billingQueue',
    `A class takes at most ${MAX_CONSTRUCTOR_DEPENDENCIES} dependencies: split a larger class by responsibility`
  ])
}

passCheck(`Constructor dependencies named by type: ${files.length} files checked`)
