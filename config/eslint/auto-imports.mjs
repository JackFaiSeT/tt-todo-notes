import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const NUXT_IMPORTS_DECLARATION = '.nuxt/types/imports.d.ts'

const DECLARED_GLOBAL_VALUE = /^\s*const (\$?[A-Za-z_][\w$]*): typeof import\(/gmu

const FRAMEWORK_AUTO_IMPORTS = [
  'ref',
  'shallowRef',
  'computed',
  'reactive',
  'readonly',
  'toRef',
  'toRefs',
  'toValue',
  'unref',
  'watch',
  'watchEffect',
  'nextTick',
  'provide',
  'inject',
  'onMounted',
  'onBeforeMount',
  'onBeforeUnmount',
  'onUnmounted',
  'onScopeDispose',
  'useTemplateRef',
  'useId',
  'useNuxtApp',
  'useRuntimeConfig',
  'useRoute',
  'useRouter',
  'useState',
  'useCookie',
  'useAsyncData',
  'useLazyAsyncData',
  'useFetch',
  'useLazyFetch',
  'refreshNuxtData',
  'clearNuxtData',
  'navigateTo',
  'createError',
  'showError',
  'clearError',
  'defineStore',
  'storeToRefs'
]

const readDeclaredAutoImports = (rootDir) => {
  const file = join(rootDir, NUXT_IMPORTS_DECLARATION)

  return existsSync(file) ? [...readFileSync(file, 'utf8').matchAll(DECLARED_GLOBAL_VALUE)].map(([, name]) => name) : []
}

export const readAutoImportNames = (rootDir) => [
  ...new Set([...FRAMEWORK_AUTO_IMPORTS, ...readDeclaredAutoImports(rootDir)])
]
