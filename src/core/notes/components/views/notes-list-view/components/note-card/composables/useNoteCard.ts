import type { EmitFn } from 'vue'
import { formatDate, toIsoDateTime } from '@shared/utils/format-date'
import { NOTE_PROGRESS_TEXTS, NOTE_ROUTES, NOTE_TEXTS } from '@notes/constants'
import { NOTE_CARD_TEXTS } from '../constants'
import type { Emits, Props } from '../types'

export type UseNoteCardResult = {
  title: ComputedRef<string>
  isUntitled: ComputedRef<boolean>
  link: ComputedRef<string>
  removeLabel: ComputedRef<string>
  moreText: ComputedRef<string>
  progressText: ComputedRef<string>
  dateTime: ComputedRef<string>
  dateText: ComputedRef<string>
  handleRemove: () => void
}

export const useNoteCard = (props: Props, emit: EmitFn<Emits>): UseNoteCardResult => {
  const title = computed<string>(() => props.note.title || NOTE_TEXTS.UNTITLED)

  const isUntitled = computed<boolean>(() => !props.note.title)

  const link = computed<string>(() => NOTE_ROUTES.ITEM(props.note.id))

  const removeLabel = computed<string>(() => NOTE_CARD_TEXTS.REMOVE(toValue(title)))

  const moreText = computed<string>(() => {
    const remaining = Math.max(0, props.note.total - props.note.preview.length)

    return remaining ? NOTE_CARD_TEXTS.MORE(remaining) : ''
  })

  const progressText = computed<string>(() =>
    props.note.total ? NOTE_PROGRESS_TEXTS.COUNT(props.note.completed, props.note.total) : NOTE_PROGRESS_TEXTS.EMPTY
  )

  const dateTime = computed<string>(() => toIsoDateTime(props.note.updatedAt))

  const dateText = computed<string>(() => formatDate(props.note.updatedAt))

  const handleRemove = (): void => emit('remove', props.note)

  return { title, isUntitled, link, removeLabel, moreText, progressText, dateTime, dateText, handleRemove }
}
