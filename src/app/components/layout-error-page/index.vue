<script setup lang="ts">
import { UI_BUTTON_VARIANTS, UiButton, UiStatusScreen } from '@uikit/components'
import { ROUTE_PATHS } from '@shared/constants/routes'
import { LAYOUT_ERROR_PAGE_TEXTS } from './constants'
import { useLayoutErrorPage } from './composables'
import type { Props } from './types'

defineOptions({ name: 'LayoutErrorPage' })

const props = defineProps<Props>()

const { code, title, description } = useLayoutErrorPage(props)
</script>

<template>
  <UiStatusScreen ref="screen" :code="code" :title="title" :description="description">
    <UiButton :variant="UI_BUTTON_VARIANTS.PRIMARY" :to="ROUTE_PATHS.HOME">{{ LAYOUT_ERROR_PAGE_TEXTS.HOME }}</UiButton>
  </UiStatusScreen>
</template>
