<script setup lang="ts">
import { BaseIcon } from '@base'
import { UiIconButton } from '@uikit/components'
import { NOTE_PROGRESS_TEXTS } from '@notes/constants'
import { NOTE_CARD_TEXTS } from './constants'
import { useNoteCard } from './composables'
import type { Emits, Props } from './types'
import TodoPreview from './components/todo-preview/index.vue'

defineOptions({ name: 'NoteCard' })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { title, isUntitled, link, removeLabel, moreText, progressText, dateTime, dateText, handleRemove } = useNoteCard(
  props,
  emit
)
</script>

<template>
  <article class="note-card">
    <div class="note-card__heading">
      <h2 class="note-card__title" :class="{ 'note-card__title--muted': isUntitled }">
        <NuxtLink class="note-card__link" :to="link">{{ title }}</NuxtLink>
      </h2>

      <UiIconButton class="note-card__remove" icon="trash" :label="removeLabel" @click="handleRemove" />
    </div>

    <TodoPreview v-if="note.total" :todos="note.preview" />
    <p v-else class="note-card__empty">{{ NOTE_CARD_TEXTS.EMPTY }}</p>
    <span v-if="moreText" class="note-card__more">{{ moreText }}</span>

    <footer class="note-card__footer">
      <span class="note-card__progress">
        <BaseIcon name="list" />
        <span v-if="note.total" class="visually-hidden">{{ NOTE_PROGRESS_TEXTS.DONE_PREFIX }}</span>
        <span class="note-card__progress-text">{{ progressText }}</span>
      </span>

      <time class="note-card__date" :datetime="dateTime">{{ dateText }}</time>
    </footer>
  </article>
</template>

<style lang="scss" scoped>
@use './styles/note-card';
</style>
