import { failCheck, passCheck } from './lib/check-output.mjs'
import {
  findAdapterViolations,
  findDataContractViolations,
  isAdapterFile,
  isDataContractsFile
} from './lib/data-contract-rules.mjs'
import { readFrontendScripts } from './lib/frontend-sources.mjs'

const entries = readFrontendScripts().filter(({ file }) => isDataContractsFile(file) || isAdapterFile(file))

const violations = entries
  .flatMap((entry) =>
    (isDataContractsFile(entry.file) ? findDataContractViolations : findAdapterViolations)(
      entry.file,
      entry.source
    ).map(({ line, message }) => `${entry.file}:${line} ${message}`)
  )
  .sort()

if (violations.length > 0) {
  failCheck('Data contracts outside the Untrusted rule', violations, [
    'domain/data-contracts.ts: export namespace N<Domain>DataContracts { export type GetReportData = Untrusted<HealthReport> }',
    'Requests the frontend builds (…RequestBody, …RequestParams) alias the exact type of @shared/contract',
    'The adapter maps every field with a fallback, declares only its I<Name>Adapter interface and does not cast'
  ])
}

passCheck(`Data contracts wrap @shared/contract into Untrusted: ${entries.length} files checked`)
