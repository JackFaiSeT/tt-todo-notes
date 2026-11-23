import { NOTE_EDITOR_NOTIFICATIONS } from '../constants'
import type { SavedNotificationContext } from '../types'

export const toSavedNotification = ({ isNew, isCopy }: SavedNotificationContext): string => {
  if (isCopy) {
    return NOTE_EDITOR_NOTIFICATIONS.COPY_SAVED
  }

  return isNew ? NOTE_EDITOR_NOTIFICATIONS.CREATED : NOTE_EDITOR_NOTIFICATIONS.SAVED
}
