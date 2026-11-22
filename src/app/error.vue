<script setup lang="ts">
import { useAppHead } from './composables'
import LayoutErrorPage from './components/layout-error-page/index.vue'
import type { Props } from './components/layout-error-page/types'

defineOptions({ name: 'AppError' })

defineProps<Props>()

useAppHead()
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <LayoutErrorPage :error="error" />
  </NuxtLayout>
</template>
