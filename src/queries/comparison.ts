import { preloadSchemaData } from '@/utils/schemaCache'
import { resolveReleaseVersion, resolveStagingUpdatedAt } from '@/utils/schemaVersion'
import type { DenormalizedPreset } from '@/utils/types'

export const comparisonKeys = {
  all: ['comparison'] as const,
  versions: () => [...comparisonKeys.all, 'versions'] as const,
  baseline: (url: string, allowLegacy: boolean) =>
    [...comparisonKeys.all, 'baseline', url, allowLegacy] as const,
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

export async function fetchComparisonBaseline(
  baselineUrl: string,
  allowLegacy = false,
): Promise<DenormalizedPreset[]> {
  const data = await preloadSchemaData(baselineUrl, { allowLegacy })
  if (!data) {
    throw new Error(`Failed to load comparison baseline from ${baselineUrl}`)
  }
  return data.presets
}
