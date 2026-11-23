<script setup lang="ts">
import { BaseIcon } from '@base'
import { ITEM_LIMIT, TITLE_LIMIT } from '@shared/contract/notes/constants'
import { hideLeavingElement } from '@shared/utils/hide-leaving-element'
import { NOTE_PROGRESS_TEXTS, NOTE_TEXTS } from '@notes/constants'
import { NOTE_EDITOR_ELEMENT_IDS, NOTE_EDITOR_TEXTS } from './constants'
import { useNoteEditorView } from './composables'
import type { Props } from './types'
import NoteEditorFallback from './components/note-editor-fallback/index.vue'
import NoteEditorNotices from './components/note-editor-notices/index.vue'
import NoteEditorSkeleton from './components/note-editor-skeleton/index.vue'
import NoteEditorToolbar from './components/note-editor-toolbar/index.vue'
import TodoRow from './components/todo-row/index.vue'

defineOptions({ name: 'NoteEditorView' })

const props = defineProps<Props>()

const {
  editor,
  outline,
  headingText,
  statusText,
  progressText,
  stateTexts,
  announcement,
  isReady,
  isPending,
  isMissing,
  isExisting,
  isAtLimit,
  isSheetVisible,
  isAddDisabled,
  addDescribedBy,
  isInvalid,
  saveHintText,
  draftSavedText,
  hasDraftNotice,
  handleStep,
  handleSave,
  handleSaveCopy,
  handleInvalid,
  handleCancel,
  handleDelete,
  handleOfferDraft,
  handleDropDraft,
  handleRetry,
  handleTitleInput,
  handleCommit,
  handleAdd,
  onTodoText,
  onTodoToggle,
  onTodoInsert,
  onTodoRemove
} = useNoteEditorView(props)
</script>

<template>
  <div class="note-editor-view">
    <template v-if="isSheetVisible">
      <NoteEditorToolbar
        ref="toolbar"
        :status-text="statusText"
        :save-hint-id="NOTE_EDITOR_ELEMENT_IDS.SAVE_HINT"
        :can-undo="editor.canUndo"
        :can-redo="editor.canRedo"
        :is-dirty="editor.isDirty"
        :is-valid="editor.isValid"
        :is-existing="isExisting"
        :is-busy="editor.isBusy"
        :is-pending="isPending"
        @step="handleStep"
        @cancel="handleCancel"
        @remove="handleDelete"
        @save="handleSave"
        @invalid="handleInvalid"
      />

      <div class="note-editor-view__body">
        <NoteEditorNotices
          v-if="isReady"
          :is-deleted="editor.isDeleted"
          :is-invalid="isInvalid"
          :has-conflict="editor.hasConflict"
          :has-candidate="hasDraftNotice"
          :draft-saved-text="draftSavedText"
          @save-copy="handleSaveCopy"
          @offer-draft="handleOfferDraft"
          @drop-draft="handleDropDraft"
        />

        <h1 ref="heading" class="note-editor-view__heading" tabindex="-1">{{ headingText }}</h1>

        <NoteEditorSkeleton v-if="isPending" :rows="outline.rows" />

        <fieldset v-else class="note-editor-view__sheet" :aria-busy="editor.isBusy">
          <div class="note-editor-view__title-section">
            <label class="note-editor-view__title-label" :for="NOTE_EDITOR_ELEMENT_IDS.TITLE_INPUT">
              {{ NOTE_EDITOR_TEXTS.TITLE_LABEL }}
            </label>

            <input
              :id="NOTE_EDITOR_ELEMENT_IDS.TITLE_INPUT"
              ref="titleInput"
              class="note-editor-view__title-input"
              :value="editor.content.title"
              :placeholder="NOTE_TEXTS.UNTITLED"
              :readonly="editor.isBusy"
              :maxlength="TITLE_LIMIT"
              @input="handleTitleInput"
              @blur="handleCommit"
            />
          </div>

          <div class="note-editor-view__items-section">
            <div class="note-editor-view__items-heading">
              <h2 class="note-editor-view__items-title">{{ NOTE_EDITOR_TEXTS.ITEMS_TITLE }}</h2>
              <span class="note-editor-view__progress">
                <span class="visually-hidden">{{ NOTE_PROGRESS_TEXTS.DONE_PREFIX }}</span>{{ progressText }}
              </span>
            </div>

            <TransitionGroup tag="ul" name="collapse" class="note-editor-view__list" @before-leave="hideLeavingElement">
              <li v-for="(todo, index) in editor.content.todos" :key="todo.id" class="note-editor-view__row">
                <TodoRow
                  ref="rows"
                  :todo="todo"
                  :index="index"
                  :is-busy="editor.isBusy"
                  :hint-id="NOTE_EDITOR_ELEMENT_IDS.SAVE_HINT"
                  @text="onTodoText(todo.id, $event)"
                  @commit="handleCommit"
                  @toggle="onTodoToggle(todo.id)"
                  @insert="onTodoInsert(todo.id)"
                  @remove="onTodoRemove(todo.id)"
                />
              </li>
            </TransitionGroup>

            <button
              ref="addButton"
              type="button"
              class="note-editor-view__add"
              :aria-disabled="isAddDisabled"
              :aria-describedby="addDescribedBy"
              @click="handleAdd"
            >
              <BaseIcon name="plus" />{{ NOTE_EDITOR_TEXTS.ADD_ITEM }}
            </button>
          </div>
        </fieldset>

        <template v-if="isReady">
          <p
            v-if="isInvalid"
            :id="NOTE_EDITOR_ELEMENT_IDS.SAVE_HINT"
            class="note-editor-view__hint note-editor-view__hint--error"
          >
            {{ saveHintText }}
          </p>

          <p v-if="isAtLimit" :id="NOTE_EDITOR_ELEMENT_IDS.ITEM_LIMIT_HINT" class="note-editor-view__hint">
            {{ NOTE_EDITOR_TEXTS.HINT_LIMIT(ITEM_LIMIT) }}
          </p>
        </template>
      </div>
    </template>

    <NoteEditorFallback
      v-else
      ref="fallback"
      :is-missing="isMissing"
      :has-candidate="editor.hasCandidate"
      @offer-draft="handleOfferDraft"
      @retry="handleRetry"
    />

    <div class="visually-hidden" role="status" aria-atomic="true">
      <span v-for="text in stateTexts" :key="text">{{ text }}</span>
    </div>
    <p class="visually-hidden" role="status">{{ announcement }}</p>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/note-editor-view';
</style>
