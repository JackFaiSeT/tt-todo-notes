export const APP_LOCALE = 'ru-RU' as const

export const DATE_FORMATS = {
  DAY: { day: 'numeric', month: 'short', year: 'numeric' },
  TIME: { hour: '2-digit', minute: '2-digit' },
  WEEKDAY: { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }
} as const satisfies Record<string, Intl.DateTimeFormatOptions>
