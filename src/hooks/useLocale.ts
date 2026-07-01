import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
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

  const { schemaReferences, loading: schemaLoading } = useSchema()

  const localesQuery = useQuery({
    queryKey: localeKeys.list(dataUrl),
    queryFn: () => fetchLocales(dataUrl),
    enabled: dataUrl.trim().length > 0,
    staleTime: SCHEMA_STALE_TIME,
  })

  const translationsQuery = useQuery({
    queryKey: localeKeys.translations(dataUrl, locale),
    queryFn: () => fetchLocaleTranslations(dataUrl, locale, schemaReferences),
    enabled: dataUrl.trim().length > 0 && locale.length > 0 && !schemaLoading,
    staleTime: SCHEMA_STALE_TIME,
  })

  const setLocale = useCallback(
    (next: string) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, locale: next || undefined }) })
    },
    [navigate],
  )

  return useMemo(
    () => ({
      locale,
      setLocale,
      locales: localesQuery.data ?? [],
      localeMap: (translationsQuery.data?.map ?? null) as LocaleMap | null,
      fieldLocaleMap: (translationsQuery.data?.fieldMap ?? null) as FieldTranslations | null,
      loading:
        localesQuery.isLoading ||
        translationsQuery.isLoading ||
        translationsQuery.isFetching ||
        schemaLoading,
      error:
        translationsQuery.error instanceof Error
          ? translationsQuery.error.message
          : translationsQuery.error
            ? String(translationsQuery.error)
            : null,
    }),
    [
      locale,
      setLocale,
      localesQuery.data,
      localesQuery.isLoading,
      translationsQuery.data,
      translationsQuery.isLoading,
      translationsQuery.isFetching,
      translationsQuery.error,
      schemaLoading,
    ],
  )
}
