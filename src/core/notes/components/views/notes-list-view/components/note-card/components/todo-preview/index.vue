<script setup lang="ts">
import { BaseIcon } from '@base'
import { TODO_PREVIEW_TEXTS } from './constants'
import type { Props } from './types'

defineOptions({ name: 'TodoPreview' })

defineProps<Props>()
</script>

<template>
  <ul class="todo-preview">
    <li
      v-for="todo in todos"
      :key="todo.id"
      class="todo-preview__item"
      :class="{ 'todo-preview__item--done': todo.done }"
    >
      <span class="todo-preview__square" aria-hidden="true">
        <BaseIcon v-if="todo.done" class="todo-preview__icon" name="check" />
      </span>

      <span class="todo-preview__text">
        {{ todo.text }}
        <span class="visually-hidden">{{ TODO_PREVIEW_TEXTS.STATE(todo.done) }}</span>
      </span>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
@use './styles/todo-preview';
</style>
