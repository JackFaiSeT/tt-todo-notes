import type { IIdClient } from '@shared/services/ids'

export const useIdClient = (): IIdClient => useNuxtApp().$idClient
