import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useEditorAnnouncement } from '@notes/components/views/note-editor-view/composables/useEditorAnnouncement'

describe('Notes/useEditorAnnouncement', () => {
  it('should clear and then repeat the text when the same text is announced twice', async () => {
    const { announcement, announce } = useEditorAnnouncement()

    announce('Отменено')
    await nextTick()
    expect(announcement.value).toBe('Отменено')

    announce('Отменено')
    expect(announcement.value).toBe('')

    await nextTick()
    expect(announcement.value).toBe('Отменено')
  })
})
