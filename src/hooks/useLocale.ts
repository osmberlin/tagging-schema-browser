import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useReference } from '@/features/data-source/reference-store'
import { useSchema } from '@/hooks/useSchema'
import { fetchLocaleTranslations, fetchLocales, localeKeys } from '@/queries/locale'
import type { LocaleMap } from '@/queries/locale'
import { SCHEMA_STALE_TIME } from '@/queries/queryClient'
import { resolveActiveDataUrl, resolveSchemaReference } from '@/utils/dataUrl'
import type { FieldTranslations } from '@/utils/types'

export type { LocaleEntry, LocaleMap } from '@/queries/locale'

export function useLocale() {
  const navigate = useNavigate()
  const dataUrlParam = useSearch({ strict: false, select: (s) => s.dataUrl ?? '' })
  const locale = useSearch({ strict: false, select: (s) => s.locale ?? '' })
  const urlReference = useSearch({ strict: false, select: (s) => s.reference })
  const persistedReference = useReference()

  const reference = resolveSchemaReference(urlReference, persistedReference)
  const dataUrl = resolveActiveDataUrl(dataUrlParam, reference)

  const { loading: schemaLoading, error: schemaError } = useSchema()

  const localesQuery = useQuery({
    queryKey: localeKeys.list(dataUrl),
    queryFn: () => fetchLocales(dataUrl),
    enabled: dataUrl.trim().length > 0,
    staleTime: SCHEMA_STALE_TIME,
  })

  const translationsQuery = useQuery({
    queryKey: localeKeys.translations(dataUrl, locale),
    queryFn: () => fetchLocaleTranslations(dataUrl, locale),
    enabled: dataUrl.trim().length > 0 && locale.length > 0 && !schemaLoading && !schemaError,
    staleTime: SCHEMA_STALE_TIME,
  })

  const translationError =
    translationsQuery.error instanceof Error
      ? translationsQuery.error.message
      : translationsQuery.error
        ? String(translationsQuery.error)
        : null

  // Drop a stale locale from the URL when it isn't available for this dataUrl.
  useEffect(
    function clearStaleLocaleFromUrl() {
      if (!locale || localesQuery.isLoading || !localesQuery.isSuccess) return
      const locales = localesQuery.data ?? []
      if (!locales.includes(locale)) {
        void navigate({
          to: '.',
          search: (prev) => ({ ...prev, locale: undefined }),
          replace: true,
        })
      }
    },
    [locale, localesQuery.data, localesQuery.isLoading, localesQuery.isSuccess, navigate],
  )

  return {
    locale,
    setLocale: (next: string) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, locale: next || undefined }) })
    },
    locales: localesQuery.data ?? [],
    localeMap: (translationsQuery.data?.map ?? null) as LocaleMap | null,
    fieldLocaleMap: (translationsQuery.data?.fieldMap ?? null) as FieldTranslations | null,
    loading:
      localesQuery.isLoading ||
      translationsQuery.isLoading ||
      translationsQuery.isFetching ||
      schemaLoading,
    error: schemaError ?? translationError,
  }
}
