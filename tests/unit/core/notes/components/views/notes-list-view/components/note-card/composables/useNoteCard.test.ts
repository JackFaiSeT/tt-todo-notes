import { describe, expect, it, vi } from 'vitest'
import { shallowReactive, toValue } from 'vue'
import { parseNoteId, parseTodoId } from '@shared/contract/notes/ids'
import type { Props } from '@notes/components/views/notes-list-view/components/note-card/types'
import { useNoteCard } from '@notes/components/views/notes-list-view/components/note-card/composables/useNoteCard'

const preview = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: parseTodoId(`todo-${index}`),
    text: `Пункт ${index}`,
    done: false
  }))

describe('Notes/useNoteCard', () => {
  it.each([
    { total: 0, completed: 0, shown: 0, more: '', progress: 'нет пунктов' },
    { total: 4, completed: 4, shown: 4, more: '', progress: '4 из 4' },
    { total: 6, completed: 2, shown: 4, more: 'ещё 2', progress: '2 из 6' }
  ])(
    'should count hidden items and progress when the note has $total items',
    ({ total, completed, shown, more, progress }) => {
      const props = shallowReactive<Props>({
        note: {
          id: parseNoteId('note'),
          title: 'Дела',
          version: 1,
          updatedAt: 0,
          total,
          completed,
          preview: preview(shown)
        }
      })

      const card = useNoteCard(props, vi.fn<Parameters<typeof useNoteCard>[1]>())

      expect(toValue(card.moreText)).toBe(more)
      expect(toValue(card.progressText)).toBe(progress)
    }
  )
})
