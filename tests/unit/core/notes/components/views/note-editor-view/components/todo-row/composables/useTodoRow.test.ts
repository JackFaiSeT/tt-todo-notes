import { describe, expect, it, vi } from 'vitest'
import { shallowReactive, toValue } from 'vue'
import { parseTodoId } from '@shared/contract/notes/ids'
import type { Emits, Props } from '@notes/components/views/note-editor-view/components/todo-row/types'
import { useTodoRow } from '@notes/components/views/note-editor-view/components/todo-row/composables/useTodoRow'

const id = parseTodoId('test-item')

describe('Notes/useTodoRow', () => {
  it.each([
    { text: '   ', done: false, isCheckDisabled: true, isStruck: false, describedBy: 'hint' },
    { text: '', done: true, isCheckDisabled: false, isStruck: false, describedBy: 'hint' },
    { text: 'Молоко', done: true, isCheckDisabled: false, isStruck: true, describedBy: undefined }
  ])(
    'should mark the row when text is "$text" and done is $done',
    ({ text, done, isCheckDisabled, isStruck, describedBy }) => {
      const props = shallowReactive<Props>({ index: 0, todo: { id, text, done }, hintId: 'hint' })
      const row = useTodoRow(props, vi.fn<(event: keyof Emits, ...args: Emits[keyof Emits]) => void>())

      expect(toValue(row.isCheckDisabled)).toBe(isCheckDisabled)
      expect(toValue(row.isStruck)).toBe(isStruck)
      expect(toValue(row.describedBy)).toBe(describedBy)
    }
  )

  it('should report an empty item as invalid only when it is not being edited', () => {
    const emit = vi.fn<(event: keyof Emits, ...args: Emits[keyof Emits]) => void>()
    const row = useTodoRow({ index: 0, todo: { id, text: '', done: false } }, emit)

    expect(toValue(row.isInvalid)).toBe(true)
    row.handleFocus()
    expect(toValue(row.isInvalid)).toBe(false)
    row.handleBlur()
    expect(toValue(row.isInvalid)).toBe(true)
    expect(emit).toHaveBeenCalledExactlyOnceWith('commit')
  })

  it.each([
    { key: 'Enter', text: 'a', isComposing: true, expected: [] },
    { key: 'Backspace', text: 'a', isComposing: false, expected: [] },
    { key: 'Enter', text: 'a', isComposing: false, expected: [['insert']] },
    { key: 'Backspace', text: '', isComposing: false, expected: [['remove']] }
  ])(
    'should dispatch the expected row action when $key is pressed with text "$text" and composition $isComposing',
    ({ key, text, isComposing, expected }) => {
      const emit = vi.fn<(event: keyof Emits, ...args: Emits[keyof Emits]) => void>()
      const row = useTodoRow({ index: 0, todo: { id, text, done: false } }, emit)
      const preventDefault = vi.fn<Event['preventDefault']>()

      row.handleKeydown({ key, isComposing, preventDefault } as unknown as KeyboardEvent)
      expect(emit.mock.calls).toEqual(expected)
      expect(preventDefault).toHaveBeenCalledTimes(expected.length)
    }
  )
})
