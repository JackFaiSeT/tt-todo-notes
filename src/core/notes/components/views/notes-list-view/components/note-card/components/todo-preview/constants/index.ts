export const TODO_PREVIEW_TEXTS = {
  STATE: (isDone: boolean): string => (isDone ? ', выполнено' : ', не выполнено')
} as const
