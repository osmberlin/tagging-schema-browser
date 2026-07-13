import type { DenormalizedPreset } from '@/utils/types'

/** Generic geometry presets that intentionally have no icon in the schema. */
const EXPECTED_NO_ICON_IDS = new Set(['line', 'point', 'area'])

/**
 * Presets that are expected to have no icon — excluded from `hasIcon: no` review
 * lists so missing-icon audits focus on gaps that matter.
 */
export function isExpectedNoIconPreset(preset: Pick<DenormalizedPreset, 'id'>): boolean {
  const { id } = preset
  if (EXPECTED_NO_ICON_IDS.has(id)) return true
  // `address`, `addr/interpolation`, and any future `addr/…` presets.
  if (id.startsWith('addr')) return true
  return false
}
