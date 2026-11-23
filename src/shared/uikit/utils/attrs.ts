export type ComponentAttrs = Readonly<Record<string, unknown>>

const ROOT_ATTRIBUTES: ReadonlySet<string> = new Set(['class', 'style'])

export const toRootAttrs = (attrs: ComponentAttrs): Record<string, unknown> =>
  Object.fromEntries(Object.entries(attrs).filter(([name]) => ROOT_ATTRIBUTES.has(name)))

export const toControlAttrs = (attrs: ComponentAttrs): Record<string, unknown> =>
  Object.fromEntries(Object.entries(attrs).filter(([name]) => !ROOT_ATTRIBUTES.has(name)))
