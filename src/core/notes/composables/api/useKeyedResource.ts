import type { NuxtError } from '#app'
import type { DraftKey } from '@shared/contract/notes/ids'
import { ASYNC_DATA_DEDUPE } from '@shared/constants/async-data'
import type { NNotes } from '@notes/domain'

export type KeyedResourceOptions<TModel> = {
  toDataKey: (key: DraftKey) => string
  fetch: (key: DraftKey, signal: AbortSignal) => Promise<TModel>
}

export type UseKeyedResourceResult<TModel> = {
  resource: Ref<NNotes.Resource<TModel> | undefined>
  error: Ref<NuxtError | undefined>
  load: (key: DraftKey) => Promise<TModel | null>
  prime: (resource: NNotes.Resource<TModel>) => void
}

export const useKeyedResource = <TModel>(
  keySource: MaybeRefOrGetter<DraftKey>,
  { toDataKey, fetch }: KeyedResourceOptions<TModel>
): UseKeyedResourceResult<TModel> => {
  let primed: NNotes.Resource<TModel> | undefined

  const takePrimed = (dataKey: string): NNotes.Resource<TModel> | undefined => {
    if (!primed || toDataKey(primed.key) !== dataKey) {
      return undefined
    }

    const cached = primed

    primed = undefined

    return cached
  }

  const {
    data: resource,
    error,
    execute
  } = useLazyAsyncData<NNotes.Resource<TModel>>(
    computed<string>(() => toDataKey(toValue(keySource))),
    async (_nuxtApp, { signal }) => {
      const key = toValue(keySource)

      return { key, model: await fetch(key, signal) }
    },
    { immediate: false, getCachedData: takePrimed }
  )

  const load = async (key: DraftKey): Promise<TModel | null> => {
    await execute({ dedupe: ASYNC_DATA_DEDUPE.DEFER })

    const failure = toValue(error)

    if (failure) {
      throw failure
    }

    const loaded = toValue(resource)

    return loaded?.key === key ? loaded.model : null
  }

  const prime = (next: NNotes.Resource<TModel>): void => {
    if (next.key !== toValue(keySource)) {
      primed = next
    }

    resource.value = next
  }

  watch(
    () => toDataKey(toValue(keySource)),
    (_next, previous) => clearNuxtData(previous)
  )

  onScopeDispose(() => clearNuxtData(toDataKey(toValue(keySource))))

  return { resource, error, load, prime }
}
