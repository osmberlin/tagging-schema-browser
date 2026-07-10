import { useMemo } from 'react'
import {
  isIconSvgConfirmedMissing,
  useIconRegistryEpoch,
} from '@/components/PageIcons/iconRegistry'
import { usePresetSearch } from '@/components/PagePresets/usePresetSearch'
import type { DenormalizedPreset } from '@/utils/types'

/** Presets whose icon name has no SVG after suppliers finished loading. */
export function countBrokenPresetIcons(presets: DenormalizedPreset[]): number {
  return presets.filter((preset) => preset.icon && isIconSvgConfirmedMissing(preset.icon)).length
}

/** Broken preset icon count; updates when async icon loads finish. */
export function useBrokenPresetIconCount(presets: DenormalizedPreset[] = []): number {
  useIconRegistryEpoch()
  return useMemo(() => countBrokenPresetIcons(presets), [presets])
}

/** Broken count from preset search facets (same number as the presets-page banner). */
export function useBrokenPresetIconCountFromSearch(): number {
  const searchResult = usePresetSearch()
  return useMemo(() => {
    const bucket = searchResult?.aggregations?.hasIcon?.buckets?.find((b) => b.key === 'broken')
    return bucket?.doc_count ?? 0
  }, [searchResult])
}
