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

/**
 * Whether `parent` is a generic form of `child` outside the slash-id hierarchy: it matches on a
 * wildcard where the child has a concrete value, and on nothing the child lacks (`piste/piste`
 * with `piste:type=*` covers its sibling `piste/downhill`).
 */
export function coversPresetGenerically(
  parent: Pick<DenormalizedPreset, 'id' | 'tags'>,
  child: Pick<DenormalizedPreset, 'id' | 'tags'>,
): boolean {
  if (parent.id === child.id) return false
  const parentTags = Object.entries(parent.tags)
  const hasCoveredWildcard = parentTags.some(
    ([key, value]) => value === '*' && child.tags[key] !== undefined && child.tags[key] !== '*',
  )
  if (!hasCoveredWildcard) return false
  return parentTags.every(([key, value]) =>
    value === '*' ? child.tags[key] !== undefined : child.tags[key] === value,
  )
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

/**
 * Whether choosing `fieldKey=optionValue` on a feature of `parent` is all it takes to match
 * `child`. False when the option is the parent's own tag (`religion=christian` on the Christian
 * church is no step towards `…/jehovahs_witness`) and when the child needs a further tag the
 * parent does not write (`denomination=…`, `social_facility:for=senior`). An option that replaces
 * the parent's value counts (`sport=karting` on a `sport=motor` raceway).
 */
export function optionLeadsToPreset(
  parent: Pick<DenormalizedPreset, 'tags' | 'addTags'>,
  child: Pick<DenormalizedPreset, 'tags'>,
  fieldKey: string,
  optionValue: string,
): boolean {
  if (parent.tags[fieldKey] === optionValue) return false

  const written = { ...parent.tags, ...parent.addTags }
  return Object.entries(child.tags).every(([key, value]) => {
    if (key === fieldKey) return value === optionValue
    return value === '*' ? written[key] !== undefined : written[key] === value
  })
}
