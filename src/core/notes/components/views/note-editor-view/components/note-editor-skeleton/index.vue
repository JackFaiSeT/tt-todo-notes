<script setup lang="ts">
import { BaseIcon } from '@base'
import { UiSkeleton } from '@uikit/components'
import { NOTE_EDITOR_TEXTS } from '@notes/components/views/note-editor-view/constants'
import type { Props } from './types'

defineOptions({ name: 'NoteEditorSkeleton' })

defineProps<Props>()
</script>

<template>
  <div class="note-editor-skeleton" aria-hidden="true">
    <div class="note-editor-skeleton__title-section">
      <span class="note-editor-skeleton__title-label">{{ NOTE_EDITOR_TEXTS.TITLE_LABEL }}</span>
      <div class="note-editor-skeleton__title-field">
        <UiSkeleton class="note-editor-skeleton__title" />
      </div>
    </div>

    <div class="note-editor-skeleton__items-section">
      <div class="note-editor-skeleton__items-heading">
        <span class="note-editor-skeleton__items-title">{{ NOTE_EDITOR_TEXTS.ITEMS_TITLE }}</span>
        <UiSkeleton class="note-editor-skeleton__progress" />
      </div>

      <div v-for="row in rows" :key="row" class="note-editor-skeleton__row">
        <UiSkeleton class="note-editor-skeleton__square" />
        <UiSkeleton class="note-editor-skeleton__line" />
      </div>

      <span class="note-editor-skeleton__add"><BaseIcon name="plus" />{{ NOTE_EDITOR_TEXTS.ADD_ITEM }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/note-editor-skeleton';
</style>
