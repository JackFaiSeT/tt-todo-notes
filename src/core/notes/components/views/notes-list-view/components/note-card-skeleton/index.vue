<script setup lang="ts">
import { UiSkeleton } from '@uikit/components'
import { NOTE_CARD_SKELETON_ROWS } from './constants'

defineOptions({ name: 'NoteCardSkeleton' })
</script>

<template>
  <div class="note-card-skeleton" aria-hidden="true">
    <div class="note-card-skeleton__heading">
      <UiSkeleton class="note-card-skeleton__title" />
    </div>

    <div class="note-card-skeleton__rows">
      <div v-for="row in NOTE_CARD_SKELETON_ROWS" :key="row" class="note-card-skeleton__row">
        <UiSkeleton class="note-card-skeleton__square" />
        <UiSkeleton class="note-card-skeleton__line" />
      </div>
    </div>

    <div class="note-card-skeleton__footer">
      <UiSkeleton class="note-card-skeleton__meta" />
      <UiSkeleton class="note-card-skeleton__meta" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/note-card-skeleton';
</style>
