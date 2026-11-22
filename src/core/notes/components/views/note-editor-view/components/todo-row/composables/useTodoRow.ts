import type { EmitFn } from 'vue'
import { KEYBOARD_KEYS } from '@uikit/constants/keyboard'
import type { TodoId } from '@shared/contract/notes/ids'
import { isBlankTodo } from '@notes/utils/content'
import { TODO_ROW_TEXTS } from '../constants'
import type { Emits, Props } from '../types'

export type UseTodoRowResult = {
  checkLabel: ComputedRef<string>
  inputLabel: ComputedRef<string>
  removeLabel: ComputedRef<string>
  isBlank: ComputedRef<boolean>
  isInvalid: ComputedRef<boolean>
  isStruck: ComputedRef<boolean>
  isCheckDisabled: ComputedRef<boolean>
  describedBy: ComputedRef<string | undefined>
  focus: () => void
  containsFocus: () => boolean
  getId: () => TodoId
  handleKeydown: (event: KeyboardEvent) => void
  handleInput: (event: Event) => void
  handleFocus: () => void
  handleBlur: () => void
  onToggle: (isChecked: boolean) => void
}

export const useTodoRow = (props: Props, emit: EmitFn<Emits>): UseTodoRowResult => {
  const input = useTemplateRef<HTMLInputElement>('input')
  const row = useTemplateRef<HTMLElement>('row')

  const position = computed<number>(() => props.index + 1)

  const name = computed<string>(() => props.todo.text.trim())

  const checkLabel = computed<string>(() =>
    TODO_ROW_TEXTS.CHECK(toValue(name) || TODO_ROW_TEXTS.CHECK_FALLBACK(toValue(position)))
  )

  const inputLabel = computed<string>(() => TODO_ROW_TEXTS.ITEM(toValue(position)))

  const removeLabel = computed<string>(() =>
    toValue(name) ? TODO_ROW_TEXTS.REMOVE_NAMED(toValue(name)) : TODO_ROW_TEXTS.REMOVE_INDEXED(toValue(position))
  )

  const isEditing = shallowRef<boolean>(false)

  const isBlank = computed<boolean>(() => isBlankTodo(props.todo))

  const isInvalid = computed<boolean>(() => toValue(isBlank) && !toValue(isEditing))

  const isStruck = computed<boolean>(() => props.todo.done && !toValue(isBlank))

  const isCheckDisabled = computed<boolean>(() => props.isBusy || (toValue(isBlank) && !props.todo.done))

  const describedBy = computed<string | undefined>(() => (toValue(isBlank) ? props.hintId : undefined))

  const focus = (): void => toValue(input)?.focus()

  const containsFocus = (): boolean => Boolean(toValue(row)?.contains(document.activeElement))

  const getId = (): TodoId => props.todo.id

  const handleKeydown = (event: KeyboardEvent): void => {
    if (props.isBusy || event.isComposing) {
      return
    }

    if (event.key === KEYBOARD_KEYS.ENTER) {
      event.preventDefault()
      emit('insert')
    }

    if (event.key === KEYBOARD_KEYS.BACKSPACE && !props.todo.text) {
      event.preventDefault()
      emit('remove')
    }
  }

  const handleInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      emit('text', event.target.value)
    }
  }

  const handleFocus = (): void => {
    isEditing.value = true
  }

  const handleBlur = (): void => {
    isEditing.value = false
    emit('commit')
  }

  const onToggle = (isChecked: boolean): void => {
    if (isChecked !== props.todo.done) {
      emit('toggle')
    }
  }

  return {
    checkLabel,
    inputLabel,
    removeLabel,
    isBlank,
    isInvalid,
    isStruck,
    isCheckDisabled,
    describedBy,
    focus,
    containsFocus,
    getId,
    handleKeydown,
    handleInput,
    handleFocus,
    handleBlur,
    onToggle
  }
}
