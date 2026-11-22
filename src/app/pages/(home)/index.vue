<script setup lang="ts">
import { NotesListView } from '@notes/components'
import { useNotesListRoutePage } from './composables'

defineOptions({ name: 'NotesListPage' })

useNotesListRoutePage()
</script>

<template>
  <NotesListView />
</template>
