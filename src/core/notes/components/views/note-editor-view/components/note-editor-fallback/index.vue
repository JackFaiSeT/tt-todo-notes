<script setup lang="ts">
import { UI_BUTTON_VARIANTS, UiButton, UiStatusScreen } from '@uikit/components'
import { ROUTE_PATHS } from '@shared/constants/routes'
import { NOTE_TEXTS } from '@notes/constants'
import { NOTE_EDITOR_FALLBACK_TEXTS } from './constants'
import { useNoteEditorFallback } from './composables'
import type { Emits, Props } from './types'

defineOptions({ name: 'NoteEditorFallback' })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { code, title, description, focus } = useNoteEditorFallback(props)

defineExpose({ focus })
</script>

<template>
  <UiStatusScreen ref="screen" :code="code" :title="title" :description="description">
    <template v-if="isMissing">
      <UiButton :variant="UI_BUTTON_VARIANTS.PRIMARY" :to="ROUTE_PATHS.HOME">{{ NOTE_TEXTS.BACK_TO_LIST }}</UiButton>
      <UiButton v-if="hasCandidate" @click="emit('offerDraft')">{{
        NOTE_EDITOR_FALLBACK_TEXTS.RESTORE_DRAFT
      }}</UiButton>
    </template>

    <template v-else>
      <UiButton :variant="UI_BUTTON_VARIANTS.PRIMARY" @click="emit('retry')">{{ NOTE_TEXTS.RETRY }}</UiButton>
      <UiButton :to="ROUTE_PATHS.HOME">{{ NOTE_TEXTS.BACK_TO_LIST }}</UiButton>
    </template>
  </UiStatusScreen>
</template>
