import type { DenormalizedPreset } from '@/utils/types'

/** Number of tags a preset needs to match; fewer means a more generic preset. */
function matchTagCount(preset: DenormalizedPreset): number {
  return Object.keys(preset.tags).length
}

/**
 * Preferred child preset for a field option: the most generic one (fewest match tags), so
 * `healthcare=alternative` picks `healthcare/alternative` rather than its
 * `…/traditional_chinese_medicine` specialization. Ties keep the longest id.
 */
export function isBetterChildPreset(
  candidate: DenormalizedPreset,
  existing: DenormalizedPreset | undefined,
): boolean {
  if (!existing) return true
  const countDiff = matchTagCount(candidate) - matchTagCount(existing)
  if (countDiff !== 0) return countDiff < 0
  return candidate.id.length > existing.id.length
}

/** Preset that writes `key=value` via `addTags` without matching on it (`amenity/dentist`). */
export function writesOptionViaAddTags(
  preset: DenormalizedPreset,
  fieldKey: string,
  optionValue: string,
): boolean {
  return preset.addTags?.[fieldKey] === optionValue && preset.tags[fieldKey] !== optionValue
}

/**
 * Whether `specialized` implies the `generic` preset: applying it also writes every tag
 * `generic` matches on (`healthcare/dentist/orthodontics` writes `amenity=dentist`, which
 * `amenity/dentist` matches on).
 */
export function impliesPreset(
  specialized: DenormalizedPreset,
  generic: DenormalizedPreset,
): boolean {
  const written = specialized.addTags ?? specialized.tags
  return Object.entries(generic.tags).every(([key, value]) => written[key] === value)
}
