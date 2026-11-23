export type UseNotesEmptyStateResult = {
  titleId: string
}

export const useNotesEmptyState = (): UseNotesEmptyStateResult => ({ titleId: useId() })
