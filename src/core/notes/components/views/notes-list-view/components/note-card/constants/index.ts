export const NOTE_CARD_TEXTS = {
  EMPTY: 'Пунктов нет',
  MORE: (count: number): string => `ещё ${count}`,
  REMOVE: (title: string): string => `Удалить заметку «${title}»`
} as const
