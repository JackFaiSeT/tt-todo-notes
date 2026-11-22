import type { PageSeo } from '@app/types/seo'

export const usePageSeoMeta = (seo: MaybeRefOrGetter<PageSeo>): void => {
  const { origin } = useRequestURL()
  const route = useRoute()

  const toCanonical = (): string => origin + route.path

  const toTitle = (): string => toValue(seo).title

  const toDescription = (): string => toValue(seo).description

  useSeoMeta({
    title: toTitle,
    description: toDescription,
    ogTitle: toTitle,
    ogDescription: toDescription,
    ogUrl: toCanonical
  })

  useHead(() => ({ link: [{ rel: 'canonical', href: toCanonical() }] }))
}
