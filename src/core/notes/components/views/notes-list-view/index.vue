<script setup lang="ts">
import { BaseIcon } from '@base'
import { UI_BUTTON_VARIANTS, UiButton, UiNotice, UiSearchField, UiSkeleton } from '@uikit/components'
import { NOTE_SEARCH_MAX } from '@shared/contract/notes/constants'
import { detachLeavingElement } from '@shared/utils/detach-leaving-element'
import { NOTE_ROUTES, NOTE_TEXTS } from '@notes/constants'
import { NOTE_CELL_ATTRIBUTE, NOTES_LIST_TEXTS } from './constants'
import { useNotesListView } from './composables'
import NoteCard from './components/note-card/index.vue'
import NoteCardSkeleton from './components/note-card-skeleton/index.vue'
import NotesEmptyState from './components/notes-empty-state/index.vue'
import NotesSearchEmpty from './components/notes-search-empty/index.vue'

defineOptions({ name: 'NotesListView' })

const {
  query,
  resultSearch,
  notes,
  countText,
  countLabel,
  statusText,
  moreText,
  moreErrorText,
  skeletonCount,
  isLoading,
  isSearching,
  hasError,
  hasSearchError,
  isEmpty,
  isNothingFound,
  hasMore,
  isLoadingMore,
  handleMore,
  handleRemove,
  handleRetry,
  handleResetSearch
} = useNotesListView()
</script>

<template>
  <div ref="root" class="notes-list-view">
    <div class="notes-list-view__heading">
      <div class="notes-list-view__heading-count">
        <h1 ref="heading" tabindex="-1">{{ NOTES_LIST_TEXTS.TITLE }}</h1>
        <UiSkeleton v-if="isLoading" class="notes-list-view__count-skeleton" />
        <span v-else-if="!hasError" class="notes-list-view__count">
          <span class="visually-hidden">{{ countLabel }}</span>
          <span aria-hidden="true">{{ countText }}</span>
        </span>
      </div>

      <UiButton class="notes-list-view__create" :variant="UI_BUTTON_VARIANTS.PRIMARY" :to="NOTE_ROUTES.NEW">
        <BaseIcon name="plus" />{{ NOTES_LIST_TEXTS.CREATE }}
      </UiButton>
    </div>

    <p class="visually-hidden" role="status">{{ statusText }}</p>

    <UiNotice v-if="hasError" class="notes-list-view__notice" role="alert">
      {{ NOTES_LIST_TEXTS.LOAD_ERROR }}

      <template #action>
        <UiButton @click="handleRetry">{{ NOTE_TEXTS.RETRY }}</UiButton>
      </template>
    </UiNotice>

    <NotesEmptyState v-else-if="isEmpty" />

    <template v-else>
      <div class="notes-list-view__tools">
        <div class="notes-list-view__search" role="search">
          <UiSearchField
            ref="searchField"
            v-model="query"
            :label="NOTES_LIST_TEXTS.SEARCH"
            :clear-label="NOTES_LIST_TEXTS.SEARCH_CLEAR"
            :placeholder="NOTES_LIST_TEXTS.SEARCH"
            :maxlength="NOTE_SEARCH_MAX"
          />
        </div>

        <p class="notes-list-view__sort">{{ NOTES_LIST_TEXTS.SORT }}</p>
      </div>

      <UiNotice v-if="hasSearchError" class="notes-list-view__notice" role="alert">
        {{ NOTES_LIST_TEXTS.SEARCH_ERROR }}

        <template #action>
          <UiButton @click="handleRetry">{{ NOTE_TEXTS.RETRY }}</UiButton>
        </template>
      </UiNotice>

      <NotesSearchEmpty v-if="isNothingFound" :search="resultSearch" @reset="handleResetSearch" />

      <TransitionGroup
        v-else
        tag="ul"
        name="list"
        class="notes-list-view__grid"
        :class="{ 'notes-list-view__grid--stale': isSearching }"
        :aria-busy="isSearching"
        @before-leave="detachLeavingElement"
      >
        <li
          v-for="note in notes"
          :key="note.id"
          class="notes-list-view__cell"
          v-bind="{ [NOTE_CELL_ATTRIBUTE]: note.id }"
        >
          <NoteCard :note="note" @remove="handleRemove" />
        </li>

        <li v-for="index in skeletonCount" :key="`skeleton-${index}`" class="notes-list-view__cell" aria-hidden="true">
          <NoteCardSkeleton />
        </li>
      </TransitionGroup>

      <div v-if="hasMore" ref="moreControl" class="notes-list-view__more">
        <UiButton :aria-busy="isLoadingMore" :aria-disabled="isLoadingMore" @click="handleMore">{{
          moreText
        }}</UiButton>
      </div>

      <p v-if="moreErrorText" class="notes-list-view__more-error" role="alert">{{ moreErrorText }}</p>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/notes-list-view';
</style>
