import { useMemo } from 'react'
import {
  isIconSvgConfirmedMissing,
  useIconRegistryEpoch,
} from '@/components/PageIcons/iconRegistry'
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
