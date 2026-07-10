import { getSchemaLoadError, preloadSchemaData } from '@/utils/schemaCache'
import { resolveReleaseVersion, resolveUnreleasedUpdatedAt } from '@/utils/schemaVersion'
import type { DenormalizedPreset } from '@/utils/types'

export const comparisonKeys = {
  all: ['comparison'] as const,
  versions: () => [...comparisonKeys.all, 'versions'] as const,
  baseline: (url: string) => [...comparisonKeys.all, 'baseline', url] as const,
}

export type ComparisonVersions = {
  releaseVersion: string | null
  unreleasedUpdatedAt: string | null
}

export async function fetchComparisonVersions(): Promise<ComparisonVersions> {
  const [releaseVersion, unreleasedUpdatedAt] = await Promise.all([
    resolveReleaseVersion(),
    resolveUnreleasedUpdatedAt(),
  ])
  return { releaseVersion, unreleasedUpdatedAt }
}

export async function fetchComparisonBaseline(baselineUrl: string): Promise<DenormalizedPreset[]> {
  const data = await preloadSchemaData(baselineUrl)
  if (!data) {
    throw new Error(
      getSchemaLoadError(baselineUrl) ?? `Failed to load comparison baseline from ${baselineUrl}`,
    )
  }
  return data.presets
}
