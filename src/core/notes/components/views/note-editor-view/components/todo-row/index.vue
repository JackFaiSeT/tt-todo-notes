<script setup lang="ts">
import { UiCheckbox, UiIconButton } from '@uikit/components'
import { TODO_LIMIT } from '@shared/contract/notes/constants'
import { TODO_ROW_TEXTS } from './constants'
import { useTodoRow } from './composables'
import type { Emits, Props } from './types'

defineOptions({ name: 'TodoRow' })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const {
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
} = useTodoRow(props, emit)

defineExpose({ focus, containsFocus, getId })
</script>

<template>
  <div ref="row" class="todo-row" :class="{ 'todo-row--done': isStruck, 'todo-row--blank': isBlank }">
    <div class="todo-row__body">
      <UiCheckbox
        class="todo-row__check"
        :model-value="todo.done"
        :label="checkLabel"
        :disabled="isCheckDisabled"
        @update:model-value="onToggle"
      />

      <input
        ref="input"
        class="todo-row__input"
        :value="todo.text"
        :aria-label="inputLabel"
        :aria-invalid="isInvalid"
        :aria-describedby="describedBy"
        :placeholder="TODO_ROW_TEXTS.PLACEHOLDER"
        :readonly="isBusy"
        :maxlength="TODO_LIMIT"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />

      <UiIconButton
        class="todo-row__remove"
        icon="close"
        :label="removeLabel"
        :disabled="isBusy"
        @click="emit('remove')"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/todo-row';
</style>
