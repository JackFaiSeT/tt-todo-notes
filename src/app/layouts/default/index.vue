<script setup lang="ts">
import LayoutHeader from '@app/components/layout-header/index.vue'
import LayoutModals from '@app/components/layout-modals/index.vue'
import LayoutNotifications from '@app/components/layout-notifications/index.vue'
import { DEFAULT_LAYOUT_TEXTS, MAIN_CONTENT_ANCHOR, MAIN_CONTENT_ID } from './constants'
import { useDefaultLayout } from './composables'

defineOptions({ name: 'DefaultLayout' })

const { isBackgroundInert, skipToContent } = useDefaultLayout()
</script>

<template>
  <div class="default">
    <div class="default__page" :inert="isBackgroundInert">
      <a class="default__skip" :href="MAIN_CONTENT_ANCHOR" @click="skipToContent">{{ DEFAULT_LAYOUT_TEXTS.SKIP }}</a>
      <LayoutHeader />
      <main :id="MAIN_CONTENT_ID" ref="main" class="default__main" tabindex="-1">
        <slot />
      </main>
    </div>

    <LayoutNotifications />
    <LayoutModals />
  </div>
</template>

<style lang="scss" scoped>
@use './styles/default';
</style>
