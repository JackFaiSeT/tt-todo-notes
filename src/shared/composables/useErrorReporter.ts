import type { IErrorReporter } from '@shared/services/error-reporter'

export const useErrorReporter = (): IErrorReporter => useNuxtApp().$errorReporter
