import { useMemo } from 'react'
import {
  isIconSvgConfirmedMissing,
  useIconRegistryEpoch,
} from '@/components/PageIcons/iconRegistry'
import {
  ensurePresetSearchIndex,
  PRESET_SEARCH_ALL,
  searchPresets,
} from '@/components/PagePresets/presetSearch'
import type { DenormalizedPreset } from '@/utils/types'

/** Presets whose icon name has no SVG after suppliers finished loading. */
export function countBrokenPresetIcons(presets: DenormalizedPreset[]): number {
  return presets.filter((preset) => preset.icon && isIconSvgConfirmedMissing(preset.icon)).length
}

/** Broken preset icon count; updates when async icon loads finish. */
export function useBrokenPresetIconCount(presets: DenormalizedPreset[] = []): number {
  useIconRegistryEpoch()
  return countBrokenPresetIcons(presets)
}

/**
 * Full-schema broken preset icon count for overview banners.
 * Uses unfiltered search aggregations so active preset filters do not hide issues.
 */
export function useBrokenPresetIconBannerCount(
  dataUrl: string | null | undefined,
  presets: DenormalizedPreset[] = [],
): number {
  const iconEpoch = useIconRegistryEpoch()
  return useMemo(() => {
    if (!dataUrl || presets.length === 0) return 0
    ensurePresetSearchIndex(dataUrl, presets, iconEpoch)
    const result = searchPresets({
      query: '',
      filters: {},
      page: 1,
      per_page: PRESET_SEARCH_ALL,
      sort: 'name_asc',
    })
    if (!result) return 0
    const buckets = result.aggregations?.hasIcon?.buckets ?? []
    return buckets.find((bucket) => bucket.key === 'broken')?.doc_count ?? 0
  }, [dataUrl, presets, iconEpoch])
}
