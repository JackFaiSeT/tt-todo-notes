export const errorCauses = (cause: unknown): Error[] => {
  const causes: Error[] = []

  while (cause instanceof Error && !causes.includes(cause)) {
    causes.push(cause)
    cause = cause.cause
  }

  return causes
}
