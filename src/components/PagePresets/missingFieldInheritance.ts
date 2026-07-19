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
        shouldInheritField(
          presetId,
          preset,
          fieldId,
          hostOriginalFields,
          hostOriginalMoreFields,
          allFields,
        ),
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

function overrideListMatches(
  current: MissingFieldListInheritance,
  override: MissingInheritanceOverrideList,
): boolean {
  return (
    override.parentId === current.parentId &&
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
  return overrideListMatches(current, override) ? 'intentional' : 'stale'
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

/** Strip debug-only fields so the result matches `MissingInheritanceOverride`. */
export function missingInheritanceOverrideFromCurrent(
  current: MissingFieldInheritance,
): MissingInheritanceOverride {
  const override: MissingInheritanceOverride = {}
  for (const fieldListKey of ['fields', 'moreFields'] as const) {
    const section = current[fieldListKey]
    if (!section) continue
    override[fieldListKey] = {
      parentId: section.parentId,
      missedFieldIds: [...section.missedFieldIds],
    }
  }
  return override
}

/**
 * YAML block to paste under `presets:` in `missing-inheritance-overrides.yaml`.
 * Omits `explicitPresetRefs` and other debug-only fields.
 */
export function formatMissingInheritanceOverrideYaml(
  presetId: string,
  current: MissingFieldInheritance,
): string {
  const override = missingInheritanceOverrideFromCurrent(current)
  const lines: string[] = [`  ${presetId}:`]

  for (const fieldListKey of ['fields', 'moreFields'] as const) {
    const section = override[fieldListKey]
    if (!section) continue
    lines.push(`    ${fieldListKey}:`)
    lines.push(`      parentId: ${section.parentId}`)
    lines.push('      missedFieldIds:')
    for (const fieldId of section.missedFieldIds) {
      lines.push(`        - ${fieldId}`)
    }
  }

  return `${lines.join('\n')}\n`
}

/** Format a stored override entry for issue bodies (stale removal / diff). */
export function formatMissingInheritanceOverrideYamlFromStored(
  presetId: string,
  override: MissingInheritanceOverride,
): string {
  const current: MissingFieldInheritance = {}
  for (const fieldListKey of ['fields', 'moreFields'] as const) {
    const section = override[fieldListKey]
    if (!section) continue
    current[fieldListKey] = { ...section, explicitPresetRefs: [] }
  }
  return formatMissingInheritanceOverrideYaml(presetId, current)
}
