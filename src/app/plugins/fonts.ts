import { loadFonts } from '@app/utils/load-fonts'

export default defineNuxtPlugin({
  name: 'fonts',
  parallel: true,
  setup: async () => {
    await loadFonts()
  }
})
