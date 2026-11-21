export const UI_MODAL_ROLES = {
  ALERT: 'alertdialog',
  DIALOG: 'dialog'
} as const

export const UI_MODAL_FOCUSABLE_SELECTOR =
  'a[href], button, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [tabindex]'

export const UI_MODAL_INITIAL_FOCUS_ATTRIBUTE = 'data-initial-focus'

export const UI_MODAL_TEXTS = {
  CLOSE: 'Закрыть диалог'
} as const
