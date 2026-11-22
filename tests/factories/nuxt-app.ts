import { vi } from 'vitest'
import { shallowReactive } from 'vue'
import type { NuxtApp } from '#app'

export const stubNuxtApp = (injections: Partial<NuxtApp>): void => {
  vi.stubGlobal('useNuxtApp', () => injections)
}

export const stubRoute = (path: string): { path: string } => {
  const route = shallowReactive({ path })

  vi.stubGlobal('useRoute', () => route)

  return route
}
