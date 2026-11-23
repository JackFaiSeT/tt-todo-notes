import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  onUnmounted,
  onWatcherCleanup,
  shallowReadonly,
  shallowRef,
  toValue,
  triggerRef,
  useId,
  useTemplateRef,
  watch
} from 'vue'
import { defineStore, storeToRefs } from 'pinia'

const AUTO_IMPORTS = {
  computed,
  defineStore,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  onUnmounted,
  onWatcherCleanup,
  shallowReadonly,
  shallowRef,
  storeToRefs,
  toValue,
  triggerRef,
  useId,
  useTemplateRef,
  watch
}

Object.assign(globalThis, AUTO_IMPORTS)
