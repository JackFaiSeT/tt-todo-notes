import type { EmitFn } from 'vue'
import { UI_BUTTON_VARIANTS } from '@uikit/components/ui-button/constants'
import type { UiButtonVariant } from '@uikit/components/ui-button/types'
import { UI_MODAL_INITIAL_FOCUS_ATTRIBUTE, UI_MODAL_ROLES } from '@uikit/components/ui-modal/constants'
import type { UiModalRole } from '@uikit/components/ui-modal/types'
import { DIALOG_ANSWERS } from '@shared/constants/dialog'
import { LAYOUT_DIALOG_TEXTS } from '../constants'
import type { Emits, InitialFocusAttrs, Props } from '../types'

const INITIAL_FOCUS_ATTRS: InitialFocusAttrs = { [UI_MODAL_INITIAL_FOCUS_ATTRIBUTE]: '' }

const NO_ATTRS: InitialFocusAttrs = {}

export type UseLayoutDialogResult = {
  role: ComputedRef<UiModalRole>
  acceptVariant: ComputedRef<UiButtonVariant>
  declineText: ComputedRef<string>
  declineAttrs: ComputedRef<InitialFocusAttrs>
  acceptAttrs: ComputedRef<InitialFocusAttrs>
  onFocused: () => void
  handleDecline: () => void
  handleAccept: () => void
  handleDismiss: () => void
}

export const useLayoutDialog = (props: Props, emit: EmitFn<Emits>): UseLayoutDialogResult => {
  const isDeclineInitial = computed<boolean>(() => Boolean(props.dialog.isDanger || props.dialog.isAcceptDisabled))

  const role = computed<UiModalRole>(() => (props.dialog.isDanger ? UI_MODAL_ROLES.ALERT : UI_MODAL_ROLES.DIALOG))

  const acceptVariant = computed<UiButtonVariant>(() =>
    props.dialog.isDanger ? UI_BUTTON_VARIANTS.DANGER : UI_BUTTON_VARIANTS.PRIMARY
  )

  const declineText = computed<string>(() => props.dialog.declineText ?? LAYOUT_DIALOG_TEXTS.DECLINE)

  const declineAttrs = computed<InitialFocusAttrs>(() => (toValue(isDeclineInitial) ? INITIAL_FOCUS_ATTRS : NO_ATTRS))

  const acceptAttrs = computed<InitialFocusAttrs>(() => (toValue(isDeclineInitial) ? NO_ATTRS : INITIAL_FOCUS_ATTRS))

  const onFocused = (): void => emit('focused', props.dialog.id)

  const handleDecline = (): void => props.dialog.answer(DIALOG_ANSWERS.DECLINE)

  const handleAccept = (): void => props.dialog.answer(DIALOG_ANSWERS.ACCEPT)

  const handleDismiss = (): void => props.dialog.answer(DIALOG_ANSWERS.DISMISS)

  return {
    role,
    acceptVariant,
    declineText,
    declineAttrs,
    acceptAttrs,
    onFocused,
    handleDecline,
    handleAccept,
    handleDismiss
  }
}
