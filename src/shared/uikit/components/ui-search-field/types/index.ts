export type Props = {
  label: string
  clearLabel: string
  placeholder?: string | undefined
  maxlength?: number | undefined
}

export type UiSearchFieldHandle = {
  focus: () => void
}
