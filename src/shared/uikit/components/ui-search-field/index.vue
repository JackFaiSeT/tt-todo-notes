<script setup lang="ts">
import { BaseIcon } from '@base'
import UiIconButton from '@uikit/components/ui-icon-button/index.vue'
import { useUiSearchField } from './composables'
import type { Props } from './types'

defineOptions({ name: 'UiSearchField' })

defineProps<Props>()

const query = defineModel<string>({ required: true })

const { handleKeydown, handleClear, focus } = useUiSearchField(query)

defineExpose({ focus })
</script>

<template>
  <div class="ui-search-field">
    <BaseIcon class="ui-search-field__icon" name="search" />
    <input
      ref="input"
      v-model="query"
      class="ui-search-field__input"
      type="search"
      autocomplete="off"
      enterkeyhint="search"
      :aria-label="label"
      :placeholder="placeholder"
      :maxlength="maxlength"
      @keydown="handleKeydown"
    />
    <UiIconButton v-if="query" class="ui-search-field__clear" icon="close" :label="clearLabel" @click="handleClear" />
  </div>
</template>

<style lang="scss" scoped>
@use './styles/ui-search-field';
</style>
