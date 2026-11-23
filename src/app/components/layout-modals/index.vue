<script setup lang="ts">
import { hideLeavingElement } from '@shared/utils/hide-leaving-element'
import { useLayoutModals } from './composables'
import LayoutDialog from './components/layout-dialog/index.vue'

defineOptions({ name: 'LayoutModals' })

const { layers, onFocused } = useLayoutModals()
</script>

<template>
  <Teleport to="body">
    <TransitionGroup tag="div" name="dialog" class="layout-modals" @before-leave="hideLeavingElement">
      <LayoutDialog
        v-for="layer in layers"
        :key="layer.dialog.id"
        :dialog="layer.dialog"
        :is-inert="layer.isInert"
        :is-top="layer.isTop"
        @focused="onFocused"
      />
    </TransitionGroup>
  </Teleport>
</template>

<style lang="scss" scoped>
@use './styles/layout-modals';
</style>
