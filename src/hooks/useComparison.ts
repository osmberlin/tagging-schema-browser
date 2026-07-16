import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { useReference } from '@/features/data-source/reference-store'
import { useSchema } from '@/hooks/useSchema'
import {
  comparisonKeys,
  fetchComparisonBaseline,
  fetchComparisonVersions,
} from '@/queries/comparison'
import { SCHEMA_STALE_TIME } from '@/queries/queryClient'
import {
  type SchemaReference,
  compareBaselineLabel,
  isCanonicalDataUrl,
  isReleaseCompareMode,
  resolveActiveDataUrl,
  resolveCompareBaselineUrl,
  resolveSchemaReference,
} from '@/utils/dataUrl'
import { type ComparisonResult, comparePresets } from '@/utils/presetDiff'
import { isUnsupportedSchemaBuildMessage } from '@/utils/schemaBuildVersion'

function ensureSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export type CompareMode = 'preview' | 'release'

export function useComparison() {
  const rawDataUrl = useSearch({ strict: false, select: (s) => s.dataUrl ?? '' })
  const urlReference = useSearch({ strict: false, select: (s) => s.reference })
  const persistedReference = useReference()
  const reference = resolveSchemaReference(urlReference, persistedReference)
  const activeDataUrl = resolveActiveDataUrl(rawDataUrl, reference)

  const { presets, loading: schemaLoading, error: schemaError } = useSchema()

  const trimmedCompare = rawDataUrl.trim()
  const releaseCompareMode = isReleaseCompareMode(trimmedCompare, reference)
  const previewCompareMode =
    trimmedCompare.length > 0 && !isCanonicalDataUrl(trimmedCompare) && !releaseCompareMode
  const isComparing = releaseCompareMode || previewCompareMode
  const compareMode: CompareMode | null = releaseCompareMode
    ? 'release'
    : previewCompareMode
      ? 'preview'
      : null
  const baselineUrl = resolveCompareBaselineUrl(trimmedCompare, reference)

  const versionsQuery = useQuery({
    queryKey: comparisonKeys.versions(),
    queryFn: fetchComparisonVersions,
    staleTime: SCHEMA_STALE_TIME,
  })

  const baselineQuery = useQuery({
    queryKey: comparisonKeys.baseline(baselineUrl ?? ''),
    queryFn: () => fetchComparisonBaseline(baselineUrl!),
    enabled: baselineUrl !== null,
    staleTime: SCHEMA_STALE_TIME,
  })

  const baselinePresets = baselineQuery.data
  const result: ComparisonResult | null =
    baselinePresets && presets.length > 0 ? comparePresets(baselinePresets, presets) : null

  const compareDomain = baselineUrl ? hostnameFromUrl(baselineUrl) : null
  const compareLabel = baselineUrl
    ? compareBaselineLabel(baselineUrl)
    : previewCompareMode
      ? 'unreleased'
      : null

  const baselineError =
    baselineQuery.error instanceof Error
      ? baselineQuery.error.message
      : baselineQuery.error
        ? String(baselineQuery.error)
        : null
  const baselineUnsupported =
    baselineError !== null && isUnsupportedSchemaBuildMessage(baselineError)
  const schemaUnsupported = schemaError !== null && isUnsupportedSchemaBuildMessage(schemaError)

  return {
    isComparing,
    compareMode,
    dataUrl: activeDataUrl,
    customPreviewUrl: previewCompareMode ? trimmedCompare : null,
    baselineUrl,
    domain: hostnameFromUrl(activeDataUrl),
    compareDomain,
    compareLabel,
    presetsUrl: `${ensureSlash(activeDataUrl)}presets.min.json`,
    releaseVersion: versionsQuery.data?.releaseVersion ?? null,
    unreleasedUpdatedAt: versionsQuery.data?.unreleasedUpdatedAt ?? null,
    result,
    loading:
      (schemaLoading && presets.length === 0) ||
      (baselineQuery.isLoading && !baselinePresets) ||
      (baselineUrl !== null && !baselineQuery.isError && baselinePresets === undefined),
    error: schemaError ?? baselineError,
    baselineError,
    schemaError,
    unsupportedNoticeMessage: baselineUnsupported
      ? baselineError
      : schemaUnsupported
        ? schemaError
        : null,
    baselineUnsupported,
    schemaUnsupported,
  }
}

/** Props previously passed to ComparisonProvider — kept for typing router wiring. */
export type ComparisonParams = {
  rawDataUrl: string
  reference: SchemaReference
  activeDataUrl: string
}
