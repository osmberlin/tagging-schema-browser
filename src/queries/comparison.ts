import { ensureIconsForPresetUsage } from '@/components/PageIcons/iconRegistry'
import { loadSchemaData } from '@/components/PagePresets/dataLoader'
import { denormalize } from '@/components/PagePresets/denormalize'
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
  const raw = await loadSchemaData(baselineUrl)
  if (raw.loadErrors.length > 0) {
    throw new Error(raw.loadErrors.join('; '))
  }
  const denorm = denormalize(raw.presets, raw.translations, raw.categories, raw.fields)
  void ensureIconsForPresetUsage(raw.presets)
  return denorm
}
