<script setup lang="ts">
import { UI_BUTTON_VARIANTS, UiButton, UiNotice } from '@uikit/components'
import { NOTE_EDITOR_NOTICE_TEXTS } from './constants'
import type { Emits, Props } from './types'

defineOptions({ name: 'NoteEditorNotices' })

defineProps<Props>()

const emit = defineEmits<Emits>()
</script>

<template>
  <div class="note-editor-notices">
    <Transition name="collapse">
      <div v-if="isDeleted" class="note-editor-notices__item">
        <div class="note-editor-notices__body">
          <UiNotice>
            {{ NOTE_EDITOR_NOTICE_TEXTS.DELETED }}

            <template #action>
              <UiButton :disabled="isInvalid" @click="emit('saveCopy')">
                {{ NOTE_EDITOR_NOTICE_TEXTS.SAVE_COPY }}
              </UiButton>
            </template>
          </UiNotice>
        </div>
      </div>

      <div v-else-if="hasConflict" class="note-editor-notices__item">
        <div class="note-editor-notices__body">
          <UiNotice>{{ NOTE_EDITOR_NOTICE_TEXTS.CONFLICT }}</UiNotice>
        </div>
      </div>
    </Transition>

    <Transition name="collapse">
      <div v-if="hasCandidate" class="note-editor-notices__item">
        <div class="note-editor-notices__body">
          <UiNotice>
            {{ NOTE_EDITOR_NOTICE_TEXTS.DRAFT_AVAILABLE(draftSavedText) }}

            <template #action>
              <UiButton :variant="UI_BUTTON_VARIANTS.PLAIN" @click="emit('dropDraft')">
                {{ NOTE_EDITOR_NOTICE_TEXTS.DROP_DRAFT }}
              </UiButton>
              <UiButton @click="emit('offerDraft')">{{ NOTE_EDITOR_NOTICE_TEXTS.OPEN_DRAFT }}</UiButton>
            </template>
          </UiNotice>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/note-editor-notices';
</style>
