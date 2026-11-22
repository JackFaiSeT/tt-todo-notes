import { describe, expect, it, vi } from 'vitest'
import { shallowReactive, toValue } from 'vue'
import type { Emits, Props } from '@notes/components/views/note-editor-view/components/note-editor-toolbar/types'
import { useNoteEditorToolbar } from '@notes/components/views/note-editor-view/components/note-editor-toolbar/composables/useNoteEditorToolbar'

const READY: Props = {
  statusText: '',
  saveHintId: 'save-hint',
  canUndo: true,
  canRedo: false,
  isDirty: true,
  isValid: true,
  isExisting: true,
  isBusy: false,
  isPending: false
}

const setup = () => {
  const props = shallowReactive<Props>({ ...READY })
  const emit = vi.fn<(event: keyof Emits, ...args: Emits[keyof Emits]) => void>()

  return { props, emit, toolbar: useNoteEditorToolbar(props, emit) }
}

describe('Notes/useNoteEditorToolbar', () => {
  it.each([
    { state: 'ready', patch: {}, save: false, cancel: false, undo: false, redo: true, hint: undefined },
    {
      state: 'invalid',
      patch: { isValid: false },
      save: true,
      cancel: false,
      undo: false,
      redo: true,
      hint: 'save-hint'
    },
    { state: 'clean', patch: { isDirty: false }, save: true, cancel: true, undo: false, redo: true, hint: undefined },
    {
      state: 'busy',
      patch: { isBusy: true, canRedo: true },
      save: true,
      cancel: true,
      undo: true,
      redo: true,
      hint: undefined
    }
  ])('should restrict actions when the editor is $state', ({ patch, save, cancel, undo, redo, hint }) => {
    const { props, toolbar } = setup()

    Object.assign(props, patch)
    expect(toValue(toolbar.isSaveDisabled)).toBe(save)
    expect(toValue(toolbar.isCancelDisabled)).toBe(cancel)
    expect(toValue(toolbar.isUndoDisabled)).toBe(undo)
    expect(toValue(toolbar.isRedoDisabled)).toBe(redo)
    expect(toValue(toolbar.saveDescriptionId)).toBe(hint)
  })

  it('should step the history only when the direction has steps', () => {
    const { emit, toolbar } = setup()

    toolbar.handleRedo()
    toolbar.handleUndo()
    expect(emit).toHaveBeenCalledExactlyOnceWith('step', 'undo')
  })

  it('should lock every action when the note is still loading', () => {
    const { props, emit, toolbar } = setup()

    props.isPending = true
    expect(toValue(toolbar.isUndoDisabled)).toBe(true)
    expect(toValue(toolbar.isCancelDisabled)).toBe(true)
    expect(toValue(toolbar.isDeleteDisabled)).toBe(true)
    toolbar.handleSave()
    expect(emit).not.toHaveBeenCalled()
  })

  it('should point to the problem instead of saving when the changed content is invalid', () => {
    const { props, emit, toolbar } = setup()

    props.isValid = false
    toolbar.handleSave()
    expect(emit).toHaveBeenCalledExactlyOnceWith('invalid')
  })

  it('should request saving when the content is valid and changed', () => {
    const { emit, toolbar } = setup()

    toolbar.handleSave()
    expect(emit).toHaveBeenCalledExactlyOnceWith('save')
  })
})
