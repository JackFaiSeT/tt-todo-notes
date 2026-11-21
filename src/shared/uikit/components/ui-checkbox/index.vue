<script setup lang="ts">
import { BaseIcon } from '@base'
import { toControlAttrs, toRootAttrs } from '@uikit/utils/attrs'
import { useUiCheckbox } from './composables'
import type { Props } from './types'

defineOptions({ name: 'UiCheckbox', inheritAttrs: false })

const props = defineProps<Props>()

const isChecked = defineModel<boolean>({ required: true })

const { inputId } = useUiCheckbox(props)
</script>

<template>
  <label v-bind="toRootAttrs($attrs)" class="ui-checkbox" :for="inputId">
    <input
      :id="inputId"
      v-model="isChecked"
      v-bind="toControlAttrs($attrs)"
      class="ui-checkbox__input"
      type="checkbox"
      :aria-label="label"
    />

    <span class="ui-checkbox__square" aria-hidden="true">
      <BaseIcon class="ui-checkbox__icon" name="check" />
    </span>
  </label>
</template>

<style lang="scss" scoped>
@use './styles/ui-checkbox';
</style>
