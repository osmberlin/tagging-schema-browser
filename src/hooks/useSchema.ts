import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useReference, useReferenceHydrated } from '@/features/data-source/reference-store'
import { SCHEMA_STALE_TIME } from '@/queries/queryClient'
import { cachedSchemaData, fetchSchemaData, schemaKeys } from '@/queries/schema'
import { resolveActiveDataUrl, resolveSchemaReference } from '@/utils/dataUrl'
import {
  SUPPORTED_SCHEMA_MAJOR,
  isSchemaBuildSupported,
  predictSchemaBuildFromUrl,
} from '@/utils/schemaBuildVersion'

export function useSchema() {
  const navigate = useNavigate()
  const dataUrlParam = useSearch({ strict: false, select: (s) => s.dataUrl ?? '' })
  const urlReference = useSearch({ strict: false, select: (s) => s.reference })
  const persistedReference = useReference()
  const hasHydrated = useReferenceHydrated()

  const reference = resolveSchemaReference(
    urlReference,
    hasHydrated ? persistedReference : 'interem',
  )
  const resolvedDataUrl = resolveActiveDataUrl(dataUrlParam, reference)
  const predictedBuild = dataUrlParam.trim() ? predictSchemaBuildFromUrl(resolvedDataUrl) : null
  const isUnsupportedUrl =
    predictedBuild !== null && !isSchemaBuildSupported(predictedBuild, resolvedDataUrl)

  const query = useQuery({
    queryKey: schemaKeys.data(resolvedDataUrl),
    queryFn: () => fetchSchemaData(resolvedDataUrl),
    enabled: resolvedDataUrl.trim().length > 0 && !isUnsupportedUrl,
    staleTime: SCHEMA_STALE_TIME,
    initialData: () => cachedSchemaData(resolvedDataUrl),
  })

  const data = query.data ?? null

  return {
    dataUrl: resolvedDataUrl,
    customDataUrl: dataUrlParam.trim() || null,
    unsupportedBuild: isUnsupportedUrl ? predictedBuild : null,
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
    schemaBuild: data?.schemaBuild ?? predictedBuild,
    presets: data?.presets ?? [],
    presetsById: data?.presetsById ?? new Map(),
    rawPresets: data?.rawPresets ?? {},
    fields: data?.fields ?? {},
    fieldTranslations: data?.fieldTranslations ?? {},
    supportedSchemaMajor: SUPPORTED_SCHEMA_MAJOR,
  }
}
