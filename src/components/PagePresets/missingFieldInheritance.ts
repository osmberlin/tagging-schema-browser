import {
  presetIdFromRef,
  resolvePresetFieldList,
  shouldInheritField,
} from '@/components/PagePresets/presetFieldInheritance'
import type { RawFields, RawPreset, RawPresets } from '@/utils/types'

export type FieldListKey = 'fields' | 'moreFields'

export type MissingFieldListInheritance = {
  parentId: string
  missedFieldIds: string[]
  /** `{preset/id}` refs present on the explicit list (excluding the slash parent). */
  explicitPresetRefs: string[]
}

export type MissingFieldInheritance = {
  fields?: MissingFieldListInheritance
  moreFields?: MissingFieldListInheritance
}

export type MissingInheritanceStatus = 'none' | 'unreviewed' | 'intentional' | 'stale'

export type MissingInheritanceOverrideList = {
  parentId: string
  missedFieldIds: string[]
}

export type MissingInheritanceOverride = {
  fields?: MissingInheritanceOverrideList
  moreFields?: MissingInheritanceOverrideList
}

export type MissingInheritanceOverrides = {
  version: number
  presets: Record<string, MissingInheritanceOverride>
}

/** Slash-parent preset id, or null for top-level presets. */
export function parentPresetId(presetId: string): string | null {
  const endIndex = presetId.lastIndexOf('/')
  if (endIndex <= 0) return null
  return presetId.substring(0, endIndex)
}

function hasParentPresetRef(explicitList: string[], parentId: string): boolean {
  return explicitList.some((item) => item === `{${parentId}}`)
}

function explicitPresetRefs(explicitList: string[]): string[] {
  return explicitList.map((item) => presetIdFromRef(item)).filter((id): id is string => id !== null)
}

/**
 * When a preset defines an explicit `fields` or `moreFields` array but does not
 * reference its slash parent (`{shop}` on `shop/pasta`), list field ids that the
 * parent resolves but this preset does not.
 */
export function detectMissingFieldInheritance(
  presetId: string,
  preset: RawPreset,
  rawPresets: RawPresets,
  allFields: RawFields,
): MissingFieldInheritance | null {
  const parentId = parentPresetId(presetId)
  if (!parentId) return null
  const parent = rawPresets[parentId]
  if (!parent) return null

  const result: MissingFieldInheritance = {}

  const hostOriginalFields = Array.isArray(preset.fields) ? preset.fields : []
  const hostOriginalMoreFields = Array.isArray(preset.moreFields) ? preset.moreFields : []

  for (const fieldListKey of ['fields', 'moreFields'] as const) {
    const explicitList = preset[fieldListKey]
    if (!Array.isArray(explicitList)) continue
    if (hasParentPresetRef(explicitList, parentId)) continue

    const parentResolved = resolvePresetFieldList(
      parentId,
      parent,
      fieldListKey,
      rawPresets,
      allFields,
    )
    const childResolved = resolvePresetFieldList(
      presetId,
      preset,
      fieldListKey,
      rawPresets,
      allFields,
    )

    const childSet = new Set(childResolved)
    const missedFieldIds = parentResolved
      .filter((fieldId) => !childSet.has(fieldId))
      .filter((fieldId) =>
        shouldInheritField(preset, fieldId, hostOriginalFields, hostOriginalMoreFields, allFields),
      )
    if (missedFieldIds.length === 0) continue

    result[fieldListKey] = {
      parentId,
      missedFieldIds,
      explicitPresetRefs: explicitPresetRefs(explicitList),
    }
  }

  return result.fields || result.moreFields ? result : null
}

function sameFieldIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((value, index) => value === sortedB[index])
}

/** Every override id must still be missing from the slash parent on the live preset. */
export function overrideMissedFieldIdsAreValid(
  current: MissingFieldListInheritance,
  override: MissingInheritanceOverrideList,
): boolean {
  if (override.parentId !== current.parentId) return false
  const currentSet = new Set(current.missedFieldIds)
  return override.missedFieldIds.every((fieldId) => currentSet.has(fieldId))
}

export function overrideDocumentsAllMissedFields(
  current: MissingFieldListInheritance,
  override: MissingInheritanceOverrideList,
): boolean {
  return (
    overrideMissedFieldIdsAreValid(current, override) &&
    sameFieldIdSet(override.missedFieldIds, current.missedFieldIds)
  )
}

/** Compare one field list (`fields` or `moreFields`) with its override snapshot. */
export function resolveMissingInheritanceListStatus(
  current: MissingFieldListInheritance | undefined,
  override: MissingInheritanceOverrideList | undefined,
): MissingInheritanceStatus {
  if (!current) {
    return override ? 'stale' : 'none'
  }
  if (!override) return 'unreviewed'
  if (!overrideMissedFieldIdsAreValid(current, override)) return 'stale'
  return overrideDocumentsAllMissedFields(current, override) ? 'intentional' : 'unreviewed'
}

/**
 * Compare live missing inheritance with a reviewed override snapshot.
 *
 * Both `fields` and `moreFields` are audited when explicitly defined without
 * `{parent}`. Overrides are per-list snapshots (`missedFieldIds`), not a single
 * "preset is OK" flag — that keeps CI able to detect when a parent gains fields
 * that children should inherit.
 *
 * A preset may document one list while the other remains unreviewed (partial
 * override). Overall status stays `unreviewed` until every detected list has a
 * matching override section.
 *
 * Within one list, `missedFieldIds` may be a **subset** of the live detection
 * (document the obvious skips first; remaining ids stay unreviewed). Stale means
 * the override references field ids that are no longer missing, or the list key
 * exists without live detection.
 */
export function resolveMissingInheritanceStatus(
  current: MissingFieldInheritance | null,
  override: MissingInheritanceOverride | undefined,
): MissingInheritanceStatus {
  if (!current || (!current.fields && !current.moreFields)) {
    return override ? 'stale' : 'none'
  }
  if (!override) return 'unreviewed'

  let hasUncoveredList = false

  for (const fieldListKey of ['fields', 'moreFields'] as const) {
    const listStatus = resolveMissingInheritanceListStatus(
      current[fieldListKey],
      override[fieldListKey],
    )
    if (listStatus === 'stale') return 'stale'
    if (listStatus === 'unreviewed') hasUncoveredList = true
  }

  return hasUncoveredList ? 'unreviewed' : 'intentional'
}

export function hasMissingFieldInheritance(status: MissingInheritanceStatus): boolean {
  return status === 'unreviewed' || status === 'intentional' || status === 'stale'
}
