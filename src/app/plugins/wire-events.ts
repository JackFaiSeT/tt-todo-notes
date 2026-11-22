import { useNotesSynchronization } from '@notes'

export default defineNuxtPlugin({
  name: 'wire-events',
  dependsOn: ['services'],
  setup: (nuxtApp) => {
    nuxtApp.vueApp.onUnmount(useNotesSynchronization())
  }
})
