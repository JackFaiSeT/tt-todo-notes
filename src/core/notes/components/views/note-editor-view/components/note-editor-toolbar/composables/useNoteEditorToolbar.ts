import type { EmitFn } from 'vue'
import { HISTORY_DIRECTIONS } from '@notes/constants'
import type { Emits, NoteEditorToolbarHandle, Props } from '../types'

export type UseNoteEditorToolbarResult = NoteEditorToolbarHandle & {
  isUndoDisabled: ComputedRef<boolean>
  isRedoDisabled: ComputedRef<boolean>
  isSaveDisabled: ComputedRef<boolean>
  isCancelDisabled: ComputedRef<boolean>
  isDeleteDisabled: ComputedRef<boolean>
  saveDescriptionId: ComputedRef<string | undefined>
  handleUndo: () => void
  handleRedo: () => void
  handleSave: () => void
}

export const useNoteEditorToolbar = (props: Props, emit: EmitFn<Emits>): UseNoteEditorToolbarResult => {
  const root = useTemplateRef<HTMLElement>('root')

  const getBottom = (): number | undefined => toValue(root)?.getBoundingClientRect().bottom

  const contains = (element: Element): boolean => Boolean(toValue(root)?.contains(element))

  const isLocked = computed<boolean>(() => props.isBusy || props.isPending)

  const isUndoDisabled = computed<boolean>(() => !props.canUndo || toValue(isLocked))

  const isRedoDisabled = computed<boolean>(() => !props.canRedo || toValue(isLocked))

  const isCancelDisabled = computed<boolean>(() => !props.isDirty || toValue(isLocked))

  const isDeleteDisabled = computed<boolean>(() => toValue(isLocked))

  const isSaveDisabled = computed<boolean>(() => !props.isValid || toValue(isCancelDisabled))

  const saveDescriptionId = computed<string | undefined>(() =>
    props.isValid || props.isPending ? undefined : props.saveHintId
  )

  const handleUndo = (): void => {
    if (!toValue(isUndoDisabled)) {
      emit('step', HISTORY_DIRECTIONS.UNDO)
    }
  }

  const handleRedo = (): void => {
    if (!toValue(isRedoDisabled)) {
      emit('step', HISTORY_DIRECTIONS.REDO)
    }
  }

  const handleSave = (): void => {
    if (!toValue(isSaveDisabled)) {
      emit('save')
    } else if (!toValue(isCancelDisabled)) {
      emit('invalid')
    }
  }

  return {
    getBottom,
    contains,
    isUndoDisabled,
    isRedoDisabled,
    isSaveDisabled,
    isCancelDisabled,
    isDeleteDisabled,
    saveDescriptionId,
    handleUndo,
    handleRedo,
    handleSave
  }
}
