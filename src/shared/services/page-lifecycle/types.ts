export type StopListening = () => void

export interface IPageLifecycle {
  onHide(handle: () => void): StopListening
  onResume(handle: () => void): StopListening
}
