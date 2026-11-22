import { APP_ERROR_SOURCES } from '@app/constants'
import { useErrorReporter } from '@shared/composables'

export default defineNuxtPlugin({
  name: 'error-handler',
  dependsOn: ['services'],
  setup: (nuxtApp) => {
    const errorReporter = useErrorReporter()

    nuxtApp.hook(APP_ERROR_SOURCES.VUE, (error) => errorReporter.report(error, APP_ERROR_SOURCES.VUE))
    nuxtApp.hook(APP_ERROR_SOURCES.APP, (error) => errorReporter.report(error, APP_ERROR_SOURCES.APP))
  }
})
