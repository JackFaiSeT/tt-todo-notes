import { useTimeClient } from '@shared/composables'
import { formatWeekday, toIsoDateTime } from '@shared/utils/format-date'

export type UseLayoutHeaderResult = {
  dateText: string
  dateTime: string
}

export const useLayoutHeader = (): UseLayoutHeaderResult => {
  const today = useTimeClient().now()

  return { dateText: formatWeekday(today), dateTime: toIsoDateTime(today) }
}
