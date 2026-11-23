<script setup lang="ts">
import { BaseIcon } from '@base'
import { UiIconButton } from '@uikit/components'
import { detachLeavingElement } from '@shared/utils/detach-leaving-element'
import { LAYOUT_NOTIFICATIONS_TEXTS, NOTIFICATION_ICONS } from './constants'
import { useLayoutNotifications } from './composables'

defineOptions({ name: 'LayoutNotifications' })

const {
  notifications,
  latestStatus,
  latestAlert,
  isInert,
  handleDismiss,
  handlePointerEnter,
  handlePointerLeave,
  handleFocusIn,
  handleFocusOut
} = useLayoutNotifications()
</script>

<template>
  <div class="layout-notifications">
    <p class="visually-hidden" role="status">
      <span v-if="latestStatus" :key="latestStatus.id">{{ latestStatus.text }}</span>
    </p>
    <p class="visually-hidden" role="alert">
      <span v-if="latestAlert" :key="latestAlert.id">{{ latestAlert.text }}</span>
    </p>

    <TransitionGroup
      tag="ul"
      name="toast"
      class="layout-notifications__list"
      :inert="isInert"
      @before-leave="detachLeavingElement"
      @pointerenter="handlePointerEnter"
      @pointerleave="handlePointerLeave"
      @focusin="handleFocusIn"
      @focusout="handleFocusOut"
    >
      <li
        v-for="notification in notifications"
        :key="notification.id"
        class="layout-notifications__item"
        :class="`layout-notifications__item--${notification.kind}`"
      >
        <BaseIcon class="layout-notifications__icon" :name="NOTIFICATION_ICONS[notification.kind]" />
        <span class="layout-notifications__text">{{ notification.text }}</span>
        <UiIconButton
          class="layout-notifications__dismiss"
          icon="close"
          :label="LAYOUT_NOTIFICATIONS_TEXTS.DISMISS(notification.text)"
          @click="handleDismiss(notification.id)"
        />
      </li>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/layout-notifications';
</style>
