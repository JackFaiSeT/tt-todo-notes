import { describe, expect, it } from 'vitest'
import { HISTORY_DIRECTIONS } from '@notes/constants'
import { toHotkeyDirection, toInputDirection } from '@notes/components/views/note-editor-view/utils/hotkeys'

type KeyStroke = Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'isComposing'>

const IDLE_STROKE: KeyStroke = {
  key: 'z',
  code: 'KeyZ',
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  isComposing: false
}

const toStroke = (stroke: Partial<KeyStroke>): KeyboardEvent => ({ ...IDLE_STROKE, ...stroke }) as KeyboardEvent

describe('Notes/historyHotkeys', () => {
  it.each([
    { name: 'Ctrl+Z', stroke: { ctrlKey: true }, expected: HISTORY_DIRECTIONS.UNDO },
    { name: 'Meta+Z', stroke: { metaKey: true }, expected: HISTORY_DIRECTIONS.UNDO },
    { name: 'Ctrl+Shift+Z', stroke: { ctrlKey: true, shiftKey: true }, expected: HISTORY_DIRECTIONS.REDO },
    { name: 'Meta+Shift+Z', stroke: { metaKey: true, shiftKey: true }, expected: HISTORY_DIRECTIONS.REDO },
    { name: 'Ctrl+Y', stroke: { ctrlKey: true, key: 'y', code: 'KeyY' }, expected: HISTORY_DIRECTIONS.REDO },
    { name: 'Meta+Y', stroke: { metaKey: true, key: 'y', code: 'KeyY' }, expected: null },
    { name: 'Ctrl+Я on the Russian layout', stroke: { ctrlKey: true, key: 'я' }, expected: HISTORY_DIRECTIONS.UNDO },
    { name: 'Ctrl+Z on AZERTY', stroke: { ctrlKey: true, key: 'z', code: 'KeyW' }, expected: HISTORY_DIRECTIONS.UNDO },
    { name: 'Ctrl+W on AZERTY', stroke: { ctrlKey: true, key: 'w', code: 'KeyZ' }, expected: null },
    {
      name: 'Ctrl+Shift+Z with capital key',
      stroke: { ctrlKey: true, shiftKey: true, key: 'Z' },
      expected: HISTORY_DIRECTIONS.REDO
    },
    { name: 'Ctrl+Alt+Z', stroke: { ctrlKey: true, altKey: true }, expected: null },
    { name: 'Ctrl+Z during composition', stroke: { ctrlKey: true, isComposing: true }, expected: null },
    { name: 'plain Z', stroke: {}, expected: null },
    { name: 'Ctrl+S', stroke: { ctrlKey: true, key: 's', code: 'KeyS' }, expected: null }
  ])('should resolve $expected when the stroke is $name', ({ stroke, expected }) => {
    expect(toHotkeyDirection(toStroke(stroke))).toBe(expected)
  })

  it.each([
    { inputType: 'historyUndo', isComposing: false, expected: HISTORY_DIRECTIONS.UNDO },
    { inputType: 'historyRedo', isComposing: false, expected: HISTORY_DIRECTIONS.REDO },
    { inputType: 'historyUndo', isComposing: true, expected: null },
    { inputType: 'insertText', isComposing: false, expected: null }
  ])(
    'should resolve $expected when the native input type is $inputType and composition is $isComposing',
    ({ inputType, isComposing, expected }) => {
      expect(toInputDirection({ inputType, isComposing } as InputEvent)).toBe(expected)
    }
  )
})
