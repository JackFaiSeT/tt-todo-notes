import { describe, it, expect, vi } from 'vitest'
import { HTTP_STATUS } from '@shared/contract/http'
import { HTTP_ERROR_NAMES } from '@shared/constants/http'
import { ErrorReporter } from '@shared/services/error-reporter'

describe('Shared/ErrorReporter', () => {
  it('should report once when different hooks wrap the same cause', () => {
    const sink = vi.fn()
    const reporter = new ErrorReporter(sink)
    const failure = new Error('Ошибка')

    reporter.report(failure, 'http')
    reporter.report(new Error('vue', { cause: failure }), 'vue')
    reporter.report(new Error('app', { cause: failure }), 'app')
    expect(sink).toHaveBeenCalledExactlyOnceWith('http', failure)
  })

  it('should omit expected failures when the page wraps a missing resource or cancellation', () => {
    const sink = vi.fn()
    const reporter = new ErrorReporter(sink)

    reporter.report(new Error('missing', { cause: { statusCode: HTTP_STATUS.NOT_FOUND } }), 'app')
    reporter.report(new DOMException('cancelled', HTTP_ERROR_NAMES.ABORT), 'http')
    expect(sink).not.toHaveBeenCalled()
  })
})
