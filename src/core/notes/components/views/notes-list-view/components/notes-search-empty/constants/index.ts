export const NOTES_SEARCH_EMPTY_TEXTS = {
  TITLE: 'Ничего не найдено',
  DESCRIPTION: (search: string): string =>
    `По запросу «${search}» заметок нет. Проверьте написание или сбросьте поиск.`,
  RESET: 'Сбросить поиск'
} as const
