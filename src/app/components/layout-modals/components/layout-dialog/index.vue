<script setup lang="ts">
import { UiButton, UiModal } from '@uikit/components'
import { useLayoutDialog } from './composables'
import type { Emits, Props } from './types'

defineOptions({ name: 'LayoutDialog' })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const {
  role,
  acceptVariant,
  declineText,
  declineAttrs,
  acceptAttrs,
  onFocused,
  handleDecline,
  handleAccept,
  handleDismiss
} = useLayoutDialog(props, emit)
</script>

<template>
  <UiModal
    class="layout-dialog"
    :role="role"
    :title="dialog.title"
    :description="dialog.description"
    :is-top="isTop"
    :is-inert="isInert"
    @focused="onFocused"
    @dismiss="handleDismiss"
  >
    <div class="layout-dialog__actions">
      <UiButton v-bind="declineAttrs" @click="handleDecline">{{ declineText }}</UiButton>
      <UiButton v-bind="acceptAttrs" :variant="acceptVariant" :disabled="dialog.isAcceptDisabled" @click="handleAccept">
        {{ dialog.acceptText }}
      </UiButton>
    </div>
  </UiModal>
</template>

<style lang="scss" scoped>
@use './styles/layout-dialog';
</style>
