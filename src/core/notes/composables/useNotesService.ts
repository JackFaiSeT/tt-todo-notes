import { NOTES_KEY } from '@notes/constants'
import type { INotesService } from '@notes/service'

export const useNotesService = (): INotesService => useNuxtApp().$services[NOTES_KEY]
