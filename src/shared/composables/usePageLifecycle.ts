import type { IPageLifecycle } from '@shared/services/page-lifecycle'

export const usePageLifecycle = (): IPageLifecycle => useNuxtApp().$pageLifecycle
