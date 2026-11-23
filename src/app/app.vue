<script setup lang="ts">
import { useAppHead } from './composables'

defineOptions({ name: 'AppRoot' })

useAppHead()
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
