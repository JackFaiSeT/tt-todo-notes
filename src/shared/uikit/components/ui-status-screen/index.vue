<script setup lang="ts">
import { useUiStatusScreen } from './composables'
import type { Props } from './types'

defineOptions({ name: 'UiStatusScreen' })

defineProps<Props>()

const { focus } = useUiStatusScreen()

defineExpose({ focus })
</script>

<template>
  <section class="ui-status-screen">
    <p v-if="code" class="ui-status-screen__code" aria-hidden="true">{{ code }}</p>
    <h1 ref="heading" class="ui-status-screen__title" tabindex="-1">{{ title }}</h1>
    <p v-if="description" class="ui-status-screen__description">{{ description }}</p>

    <div v-if="$slots.default" class="ui-status-screen__actions">
      <slot />
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use './styles/ui-status-screen';
</style>
