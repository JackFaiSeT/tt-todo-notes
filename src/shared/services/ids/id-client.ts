import type { IdParser, IIdClient, IIdProvider } from './types'

export class IdClient implements IIdClient {
  constructor(private readonly idProvider: IIdProvider) {}

  next<TId>(parse: IdParser<TId>): TId {
    return parse(this.idProvider.next())
  }
}
