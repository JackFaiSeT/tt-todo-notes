export const TODO_ROW_TEXTS = {
  PLACEHOLDER: 'Текст пункта',
  ITEM: (position: number): string => `Пункт ${position}`,
  CHECK: (name: string): string => `Выполнено: ${name}`,
  CHECK_FALLBACK: (position: number): string => `пункт ${position}`,
  REMOVE_NAMED: (text: string): string => `Удалить пункт «${text}»`,
  REMOVE_INDEXED: (position: number): string => `Удалить пункт ${position}`
} as const
