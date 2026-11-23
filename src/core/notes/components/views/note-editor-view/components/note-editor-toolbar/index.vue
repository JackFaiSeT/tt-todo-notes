<script setup lang="ts">
import { BaseIcon } from '@base'
import { UI_BUTTON_VARIANTS, UiButton, UiIconButton, UiSkeleton } from '@uikit/components'
import { ROUTE_PATHS } from '@shared/constants/routes'
import { NOTE_EDITOR_TOOLBAR_SHORTCUTS, NOTE_EDITOR_TOOLBAR_TEXTS } from './constants'
import { useNoteEditorToolbar } from './composables'
import type { Emits, Props } from './types'

defineOptions({ name: 'NoteEditorToolbar' })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const {
  getBottom,
  contains,
  isUndoDisabled,
  isRedoDisabled,
  isSaveDisabled,
  isCancelDisabled,
  isDeleteDisabled,
  saveDescriptionId,
  handleUndo,
  handleRedo,
  handleSave
} = useNoteEditorToolbar(props, emit)

defineExpose({ getBottom, contains })
</script>

<template>
  <div ref="root" class="note-editor-toolbar" role="group" :aria-label="NOTE_EDITOR_TOOLBAR_TEXTS.LABEL">
    <div class="note-editor-toolbar__inner">
      <NuxtLink class="note-editor-toolbar__back" :to="ROUTE_PATHS.HOME">
        <BaseIcon name="back" />
        <span class="note-editor-toolbar__back-text">{{ NOTE_EDITOR_TOOLBAR_TEXTS.BACK }}</span>
      </NuxtLink>

      <UiSkeleton v-if="isPending" class="note-editor-toolbar__status-skeleton" />
      <span v-else class="note-editor-toolbar__status" role="status">{{ statusText }}</span>

      <div class="note-editor-toolbar__actions">
        <UiIconButton
          icon="undo"
          :label="NOTE_EDITOR_TOOLBAR_TEXTS.UNDO"
          :aria-keyshortcuts="NOTE_EDITOR_TOOLBAR_SHORTCUTS.UNDO"
          :aria-disabled="isUndoDisabled"
          @click="handleUndo"
        />

        <UiIconButton
          icon="redo"
          :label="NOTE_EDITOR_TOOLBAR_TEXTS.REDO"
          :aria-keyshortcuts="NOTE_EDITOR_TOOLBAR_SHORTCUTS.REDO"
          :aria-disabled="isRedoDisabled"
          @click="handleRedo"
        />

        <span class="note-editor-toolbar__divider" aria-hidden="true" />

        <UiButton
          class="note-editor-toolbar__compact"
          :variant="UI_BUTTON_VARIANTS.PLAIN"
          :title="NOTE_EDITOR_TOOLBAR_TEXTS.CANCEL"
          :aria-label="NOTE_EDITOR_TOOLBAR_TEXTS.CANCEL"
          :disabled="isCancelDisabled"
          @click="emit('cancel')"
        >
          <BaseIcon name="close" />
          <span class="note-editor-toolbar__label">{{ NOTE_EDITOR_TOOLBAR_TEXTS.CANCEL }}</span>
        </UiButton>

        <UiButton
          v-if="isExisting"
          class="note-editor-toolbar__delete note-editor-toolbar__compact"
          :variant="UI_BUTTON_VARIANTS.PLAIN"
          :title="NOTE_EDITOR_TOOLBAR_TEXTS.DELETE_LABEL"
          :aria-label="NOTE_EDITOR_TOOLBAR_TEXTS.DELETE_LABEL"
          :disabled="isDeleteDisabled"
          @click="emit('remove')"
        >
          <BaseIcon name="trash" />
          <span class="note-editor-toolbar__label">{{ NOTE_EDITOR_TOOLBAR_TEXTS.DELETE }}</span>
        </UiButton>

        <UiButton
          class="note-editor-toolbar__save"
          :variant="UI_BUTTON_VARIANTS.PRIMARY"
          :aria-disabled="isSaveDisabled"
          :aria-busy="isBusy"
          :aria-describedby="saveDescriptionId"
          @click="handleSave"
        >
          {{ NOTE_EDITOR_TOOLBAR_TEXTS.SAVE }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/note-editor-toolbar';
</style>
