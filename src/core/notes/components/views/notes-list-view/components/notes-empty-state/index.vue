<script setup lang="ts">
import { UiLink } from '@uikit/components'
import { NOTE_ROUTES } from '@notes/constants'
import { NOTES_EMPTY_STATE_MARKS, NOTES_EMPTY_STATE_TEXTS } from './constants'
import { useNotesEmptyState } from './composables'

defineOptions({ name: 'NotesEmptyState' })

const { titleId } = useNotesEmptyState()
</script>

<template>
  <section class="notes-empty-state" :aria-labelledby="titleId">
    <div class="notes-empty-state__binding" aria-hidden="true">
      <i v-for="mark in NOTES_EMPTY_STATE_MARKS" :key="mark" />
    </div>

    <div class="notes-empty-state__copy">
      <h2 :id="titleId" class="notes-empty-state__title">{{ NOTES_EMPTY_STATE_TEXTS.TITLE }}</h2>
      <p class="notes-empty-state__description">
        <span v-for="line in NOTES_EMPTY_STATE_TEXTS.DESCRIPTION_LINES" :key="line" class="notes-empty-state__line">
          {{ line }}
        </span>
      </p>

      <UiLink :to="NOTE_ROUTES.NEW">{{ NOTES_EMPTY_STATE_TEXTS.CREATE }}</UiLink>
    </div>

    <div class="notes-empty-state__rules" aria-hidden="true">
      <i v-for="mark in NOTES_EMPTY_STATE_MARKS" :key="mark" />
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use './styles/notes-empty-state';
</style>
