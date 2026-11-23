<script setup lang="ts">
import { UI_MODAL_TEXTS } from './constants'
import { useUiModal } from './composables'
import type { Emits, Props } from './types'

defineOptions({ name: 'UiModal' })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { titleId, descriptionId, handleDismiss } = useUiModal(props, emit)
</script>

<template>
  <div class="ui-modal" :inert="isInert">
    <button
      class="ui-modal__backdrop"
      type="button"
      tabindex="-1"
      :aria-label="UI_MODAL_TEXTS.CLOSE"
      @click="handleDismiss"
    />

    <section
      ref="panel"
      class="ui-modal__panel"
      tabindex="-1"
      :role="role"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="descriptionId"
    >
      <h2 :id="titleId" class="ui-modal__title">{{ title }}</h2>
      <p :id="descriptionId" class="ui-modal__description">{{ description }}</p>
      <slot />
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/ui-modal';
</style>
