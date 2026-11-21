<script setup lang="ts">
import { BaseIcon } from '@base'
import type { Emits, Props } from './types'

defineOptions({ name: 'UiIconButton' })

defineProps<Props>()

const emit = defineEmits<Emits>()
</script>

<template>
  <button type="button" class="ui-icon-button" :aria-label="label" :title="label" @click="emit('click', $event)">
    <BaseIcon :name="icon" />
  </button>
</template>

<style lang="scss" scoped>
@use './styles/ui-icon-button';
</style>
