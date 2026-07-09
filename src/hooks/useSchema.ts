import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useReference, useReferenceHydrated } from '@/features/data-source/reference-store'
import { SCHEMA_STALE_TIME } from '@/queries/queryClient'
import { cachedSchemaData, fetchSchemaData, schemaKeys } from '@/queries/schema'
import { resolveActiveDataUrl, resolveSchemaReference } from '@/utils/dataUrl'
import { isLegacySearchParam } from '@/utils/schemaBuildVersion'

export function useSchema() {
  const navigate = useNavigate()
  const dataUrlParam = useSearch({ strict: false, select: (s) => s.dataUrl ?? '' })
  const urlReference = useSearch({ strict: false, select: (s) => s.reference })
  const legacyParam = useSearch({ strict: false, select: (s) => s.legacy })
  const persistedReference = useReference()
  const hasHydrated = useReferenceHydrated()

  const reference = resolveSchemaReference(
    urlReference,
    hasHydrated ? persistedReference : 'interem',
  )
  const resolvedDataUrl = resolveActiveDataUrl(dataUrlParam, reference)
  const allowLegacy = isLegacySearchParam(legacyParam)

  const query = useQuery({
    queryKey: schemaKeys.data(resolvedDataUrl, allowLegacy),
    queryFn: () => fetchSchemaData(resolvedDataUrl, { allowLegacy }),
    enabled: resolvedDataUrl.trim().length > 0,
    staleTime: SCHEMA_STALE_TIME,
    initialData: () => cachedSchemaData(resolvedDataUrl, allowLegacy),
  })

  const data = query.data ?? null

  return {
    dataUrl: resolvedDataUrl,
    allowLegacy,
    setDataUrl: (url: string | null) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, dataUrl: url ?? '' }) })
    },
    load: (url: string) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, dataUrl: url.trim() || '' }) })
    },
    loading: query.isLoading || query.isFetching,
    error:
      query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    data,
    schemaBuild: data?.schemaBuild ?? null,
    presets: data?.presets ?? [],
    presetsById: data?.presetsById ?? new Map(),
    rawPresets: data?.rawPresets ?? {},
    fields: data?.fields ?? {},
    fieldTranslations: data?.fieldTranslations ?? {},
    schemaReferences: data?.schemaReferences ?? null,
  }
}
