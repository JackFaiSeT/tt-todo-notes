<script setup lang="ts">
import { APP_NAME } from '@app/constants'
import { ROUTE_PATHS } from '@shared/constants/routes'
import { LAYOUT_HEADER_TEXTS } from './constants'
import { useLayoutHeader } from './composables'

defineOptions({ name: 'LayoutHeader' })

const { dateText, dateTime } = useLayoutHeader()
</script>

<template>
  <header class="layout-header">
    <div class="layout-header__inner">
      <NuxtLink class="layout-header__wordmark" :to="ROUTE_PATHS.HOME" :aria-label="LAYOUT_HEADER_TEXTS.HOME_LABEL">
        <span class="layout-header__wordmark-text">{{ APP_NAME }}</span>
      </NuxtLink>

      <time class="layout-header__date" :datetime="dateTime">{{ dateText }}</time>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use './styles/layout-header';
</style>
