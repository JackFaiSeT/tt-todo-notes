export const hasVersionConflict = (baseVersion: number | null, remoteVersion: number | undefined): boolean =>
  remoteVersion !== undefined && remoteVersion !== baseVersion
