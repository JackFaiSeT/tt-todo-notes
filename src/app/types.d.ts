import type { AppProvisions } from './plugins/services'

declare module '#app' {
  interface NuxtApp {
    $services: AppProvisions['services']
    $errorReporter: AppProvisions['errorReporter']
    $timeClient: AppProvisions['timeClient']
    $idClient: AppProvisions['idClient']
    $pageLifecycle: AppProvisions['pageLifecycle']
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $services: AppProvisions['services']
    $errorReporter: AppProvisions['errorReporter']
    $timeClient: AppProvisions['timeClient']
    $idClient: AppProvisions['idClient']
    $pageLifecycle: AppProvisions['pageLifecycle']
  }
}

export {}
