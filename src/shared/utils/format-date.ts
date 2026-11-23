import { APP_LOCALE, DATE_FORMATS } from '@shared/constants/locale'

const dayFormat = new Intl.DateTimeFormat(APP_LOCALE, DATE_FORMATS.DAY)

const timeFormat = new Intl.DateTimeFormat(APP_LOCALE, DATE_FORMATS.TIME)

const weekdayFormat = new Intl.DateTimeFormat(APP_LOCALE, DATE_FORMATS.WEEKDAY)

export const formatDate = (timestamp: number): string => dayFormat.format(timestamp)

export const formatTime = (timestamp: number): string => timeFormat.format(timestamp)

export const formatWeekday = (timestamp: number): string => weekdayFormat.format(timestamp)

export const toIsoDateTime = (timestamp: number): string => new Date(timestamp).toISOString()
