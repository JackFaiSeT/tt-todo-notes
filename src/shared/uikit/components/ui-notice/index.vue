<script setup lang="ts">
defineOptions({ name: 'UiNotice' })
</script>

<template>
  <div class="ui-notice">
    <span class="ui-notice__text"><slot /></span>
    <span v-if="$slots.action" class="ui-notice__action"><slot name="action" /></span>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/ui-notice';
</style>
