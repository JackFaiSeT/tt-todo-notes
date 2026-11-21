<script setup lang="ts">
import { BaseIcon } from '@base'
import type { Props } from './types'

defineOptions({ name: 'UiLink' })

defineProps<Props>()
</script>

<template>
  <NuxtLink class="ui-link" :to="to"><slot /><BaseIcon name="next" /></NuxtLink>
</template>

<style lang="scss" scoped>
@use './styles/ui-link';
</style>
