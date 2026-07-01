import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import { useReference } from '@/features/data-source/reference-store'
import { SCHEMA_STALE_TIME } from '@/queries/queryClient'
import { cachedSchemaData, fetchSchemaData, schemaKeys } from '@/queries/schema'
import { resolveActiveDataUrl, resolveSchemaReference } from '@/utils/dataUrl'

export function useSchema() {
  const navigate = useNavigate()
  const dataUrlParam = useSearch({ strict: false, select: (s) => s.dataUrl ?? '' })
  const urlReference = useSearch({ strict: false, select: (s) => s.reference })
  const persistedReference = useReference()

  const reference = resolveSchemaReference(urlReference, persistedReference)
  const resolvedDataUrl = resolveActiveDataUrl(dataUrlParam, reference)

  const query = useQuery({
    queryKey: schemaKeys.data(resolvedDataUrl),
    queryFn: () => fetchSchemaData(resolvedDataUrl),
    enabled: resolvedDataUrl.trim().length > 0,
    staleTime: SCHEMA_STALE_TIME,
    initialData: () => cachedSchemaData(resolvedDataUrl),
  })

  const setDataUrl = useCallback(
    (url: string | null) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, dataUrl: url ?? '' }) })
    },
    [navigate],
  )

  const load = useCallback(
    (url: string) => {
      setDataUrl(url.trim() || null)
    },
    [setDataUrl],
  )

  const data = query.data ?? null

  return useMemo(
    () => ({
      dataUrl: resolvedDataUrl,
      setDataUrl: (url: string | null) => {
        setDataUrl(url)
      },
      load,
      loading: query.isLoading || query.isFetching,
      error:
        query.error instanceof Error
          ? query.error.message
          : query.error
            ? String(query.error)
            : null,
      data,
      presets: data?.presets ?? [],
      presetsById: data?.presetsById ?? new Map(),
      rawPresets: data?.rawPresets ?? {},
      fields: data?.fields ?? {},
      fieldTranslations: data?.fieldTranslations ?? {},
      schemaReferences: data?.schemaReferences ?? null,
    }),
    [resolvedDataUrl, setDataUrl, load, query.isLoading, query.isFetching, query.error, data],
  )
}
