<script setup lang="ts">
import { ICON_STROKE_WIDTH, ICON_VIEW_BOX } from './constants'
import { useBaseIcon } from './composables'
import type { Props } from './types'

defineOptions({ name: 'BaseIcon' })

const props = defineProps<Props>()

const { path } = useBaseIcon(props)
</script>

<template>
  <svg
    class="base-icon"
    :viewBox="ICON_VIEW_BOX"
    fill="none"
    stroke="currentColor"
    :stroke-width="ICON_STROKE_WIDTH"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="path" />
  </svg>
</template>

<style lang="scss" scoped>
@use './styles/base-icon';
</style>
