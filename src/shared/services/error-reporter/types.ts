export type ErrorSink = (source: string, error: unknown) => void

export interface IErrorReporter {
  report(error: unknown, source: string): void
}
