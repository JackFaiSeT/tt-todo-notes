<script setup lang="ts">
import { NoteEditorView } from '@notes/components'
import { NOTE_EDITOR_PAGE_KEY } from './constants'
import { useNoteEditorRoutePage } from './composables'

defineOptions({ name: 'NoteEditorPage' })

definePageMeta({ key: NOTE_EDITOR_PAGE_KEY })

const { noteKey } = useNoteEditorRoutePage()
</script>

<template>
  <NoteEditorView :note-key="noteKey" />
</template>
