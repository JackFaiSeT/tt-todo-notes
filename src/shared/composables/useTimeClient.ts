import type { ITimeClient } from '@shared/services/time'

export const useTimeClient = (): ITimeClient => useNuxtApp().$timeClient
