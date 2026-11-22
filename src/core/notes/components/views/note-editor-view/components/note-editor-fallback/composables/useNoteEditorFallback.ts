import type { UiStatusScreenHandle } from '@uikit/components'
import { HTTP_STATUS } from '@shared/contract/http'
import { NOTE_EDITOR_FALLBACK_TEXTS } from '../constants'
import type { Props } from '../types'

export type UseNoteEditorFallbackResult = {
  code: ComputedRef<number | undefined>
  title: ComputedRef<string>
  description: ComputedRef<string>
  focus: () => void
}

export const useNoteEditorFallback = (props: Props): UseNoteEditorFallbackResult => {
  const screen = useTemplateRef<UiStatusScreenHandle>('screen')

  const code = computed<number | undefined>(() => (props.isMissing ? HTTP_STATUS.NOT_FOUND : undefined))

  const title = computed<string>(() =>
    props.isMissing ? NOTE_EDITOR_FALLBACK_TEXTS.MISSING_TITLE : NOTE_EDITOR_FALLBACK_TEXTS.ERROR_TITLE
  )

  const description = computed<string>(() =>
    props.isMissing ? NOTE_EDITOR_FALLBACK_TEXTS.MISSING_DESCRIPTION : NOTE_EDITOR_FALLBACK_TEXTS.ERROR_DESCRIPTION
  )

  const focus = (): void => toValue(screen)?.focus()

  return { code, title, description, focus }
}
