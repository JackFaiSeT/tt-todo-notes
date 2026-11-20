declare const entityIdBrand: unique symbol

export type EntityId<TName extends string> = string & {
  readonly [entityIdBrand]: TName
}

export type ValueOf<T> = T[keyof T]

export type Untrusted<T> =
  T extends EntityId<string>
    ? string
    : T extends readonly (infer Item)[]
      ? Untrusted<Item>[]
      : T extends object
        ? { [Key in keyof T]?: Untrusted<T[Key]> | null }
        : T
