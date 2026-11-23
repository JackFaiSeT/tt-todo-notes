import type { EditorAnnounce } from '../types'

export type UseEditorAnnouncementResult = {
  announcement: Readonly<ShallowRef<string>>
  announce: EditorAnnounce
}

export const useEditorAnnouncement = (): UseEditorAnnouncementResult => {
  const announcement = shallowRef<string>('')

  const announce = (text: string): void => {
    announcement.value = ''

    void nextTick(() => {
      announcement.value = text
    })
  }

  return { announcement: shallowReadonly(announcement), announce }
}
