import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import type { DraftKey } from '@shared/contract/notes/ids'
import { NOTE_ROUTES } from '@notes/constants'

export const toNotePath = (key: DraftKey): string => (key === NEW_DRAFT_KEY ? NOTE_ROUTES.NEW : NOTE_ROUTES.ITEM(key))
