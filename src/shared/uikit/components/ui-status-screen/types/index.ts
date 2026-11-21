export type Props = {
  title: string
  code?: string | number | undefined
  description?: string | undefined
}

export type UiStatusScreenHandle = {
  focus: () => void
}
