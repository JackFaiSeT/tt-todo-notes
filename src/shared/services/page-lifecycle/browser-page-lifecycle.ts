import type { IPageLifecycle, StopListening } from './types'

export class BrowserPageLifecycle implements IPageLifecycle {
  onHide(handle: () => void): StopListening {
    const onVisibilityChange = (): void => {
      if (document.hidden) {
        handle()
      }
    }

    window.addEventListener('pagehide', handle)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', handle)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }

  onResume(handle: () => void): StopListening {
    const onVisibilityChange = (): void => {
      if (!document.hidden) {
        handle()
      }
    }

    window.addEventListener('focus', handle)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('focus', handle)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }
}
