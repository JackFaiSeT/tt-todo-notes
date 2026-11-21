export type IdParser<TId> = (value: string) => TId

export interface IIdProvider {
  next(): string
}

export interface IIdClient {
  next<TId>(parse: IdParser<TId>): TId
}
