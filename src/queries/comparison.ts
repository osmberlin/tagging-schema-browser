import { preloadSchemaData } from '@/utils/schemaCache'
import { resolveReleaseVersion, resolveStagingUpdatedAt } from '@/utils/schemaVersion'
import type { DenormalizedPreset } from '@/utils/types'

export const comparisonKeys = {
  all: ['comparison'] as const,
  versions: () => [...comparisonKeys.all, 'versions'] as const,
  baseline: (url: string) => [...comparisonKeys.all, 'baseline', url] as const,
}

export type ComparisonVersions = {
  releaseVersion: string | null
  stagingUpdatedAt: string | null
}

export async function fetchComparisonVersions(): Promise<ComparisonVersions> {
  const [releaseVersion, stagingUpdatedAt] = await Promise.all([
    resolveReleaseVersion(),
    resolveStagingUpdatedAt(),
  ])
  return { releaseVersion, stagingUpdatedAt }
}

export async function fetchComparisonBaseline(baselineUrl: string): Promise<DenormalizedPreset[]> {
  const data = await preloadSchemaData(baselineUrl)
  if (!data) {
    throw new Error(`Failed to load comparison baseline from ${baselineUrl}`)
  }
  return data.presets
}
