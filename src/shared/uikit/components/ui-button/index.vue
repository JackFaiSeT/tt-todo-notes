<script setup lang="ts">
import { UI_BUTTON_VARIANTS } from './constants'
import type { Emits, Props } from './types'

defineOptions({ name: 'UiButton' })

withDefaults(defineProps<Props>(), {
  variant: UI_BUTTON_VARIANTS.SECONDARY,
  to: undefined
})

const emit = defineEmits<Emits>()
</script>

<template>
  <NuxtLink v-if="to" class="ui-button" :class="`ui-button--${variant}`" :to="to"><slot /></NuxtLink>
  <button v-else type="button" class="ui-button" :class="`ui-button--${variant}`" @click="emit('click', $event)">
    <slot />
  </button>
</template>

<style lang="scss" scoped>
@use './styles/ui-button';
</style>
