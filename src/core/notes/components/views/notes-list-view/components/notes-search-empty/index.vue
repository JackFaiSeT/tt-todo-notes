<script setup lang="ts">
import { UiButton } from '@uikit/components'
import { NOTES_SEARCH_EMPTY_TEXTS } from './constants'
import type { Emits, Props } from './types'

defineOptions({ name: 'NotesSearchEmpty' })

defineProps<Props>()

const emit = defineEmits<Emits>()
</script>

<template>
  <section class="notes-search-empty">
    <h2 class="notes-search-empty__title">{{ NOTES_SEARCH_EMPTY_TEXTS.TITLE }}</h2>
    <p class="notes-search-empty__description">{{ NOTES_SEARCH_EMPTY_TEXTS.DESCRIPTION(search) }}</p>
    <UiButton @click="emit('reset')">{{ NOTES_SEARCH_EMPTY_TEXTS.RESET }}</UiButton>
  </section>
</template>

<style lang="scss" scoped>
@use './styles/notes-search-empty';
</style>
