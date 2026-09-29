import type { RawFields, RawPreset } from '@/utils/types'

const GENERIC_TAG_VALUES = new Set(['yes', '*'])

export type RiskyTypeComboStatus = 'none' | 'unreviewed' | 'intentional' | 'stale'

export type RiskyTypeComboField = {
  fieldId: string
  fieldKey: string
  listKey: 'fields' | 'moreFields'
}

export type RiskyTypeCombo = {
  fields: RiskyTypeComboField[]
}

export type RiskyTypeComboOverride = {
  fieldIds: string[]
}

export type RiskyTypeComboOverrides = {
  version: number
  presets: Record<string, RiskyTypeComboOverride>
}

function fieldKey(fieldId: string, allFields: RawFields): string {
  return allFields[fieldId]?.key ?? fieldId
}

function isRiskyTypeComboField(
  preset: RawPreset,
  fieldId: string,
  listKey: 'fields' | 'moreFields',
  allFields: RawFields,
): boolean {
  const field = allFields[fieldId]
  if (field?.type !== 'typeCombo') return false

  const key = fieldKey(fieldId, allFields)
  const tags = preset.tags ?? {}
  const tagKeys = Object.keys(tags)
  const primaryTagKey = tagKeys[0]
  const primaryTagValue = primaryTagKey ? tags[primaryTagKey] : undefined

  if (primaryTagKey && key === primaryTagKey) return false

  if (primaryTagValue && !GENERIC_TAG_VALUES.has(primaryTagValue)) return true

  const tagValue = tags[key]
  if (tagValue !== undefined && !GENERIC_TAG_VALUES.has(tagValue)) return true

  for (const value of Object.values(tags)) {
    if (value === key && !GENERIC_TAG_VALUES.has(value)) return true
  }

  if (listKey === 'moreFields') return true

  return false
}

/** Flag resolved typeCombo fields that can write `key=yes` on presets with fixed tags. */
export function detectRiskyTypeCombo(
  preset: RawPreset,
  resolvedFields: string[],
  resolvedMoreFields: string[],
  allFields: RawFields,
): RiskyTypeCombo | null {
  const fields: RiskyTypeComboField[] = []

  for (const fieldId of resolvedFields) {
    if (!isRiskyTypeComboField(preset, fieldId, 'fields', allFields)) continue
    fields.push({ fieldId, fieldKey: fieldKey(fieldId, allFields), listKey: 'fields' })
  }

  for (const fieldId of resolvedMoreFields) {
    if (!isRiskyTypeComboField(preset, fieldId, 'moreFields', allFields)) continue
    fields.push({ fieldId, fieldKey: fieldKey(fieldId, allFields), listKey: 'moreFields' })
  }

  if (fields.length === 0) return null

  fields.sort((a, b) => a.fieldId.localeCompare(b.fieldId))
  return { fields }
}

export function resolveRiskyTypeComboStatus(
  current: RiskyTypeCombo | null,
  override: RiskyTypeComboOverride | undefined,
): RiskyTypeComboStatus {
  if (!current) {
    return override ? 'stale' : 'none'
  }
  if (!override) return 'unreviewed'

  // Like missing inheritance: the override may document a subset (rest stays unreviewed);
  // ids that are no longer risky make it stale.
  const currentIds = new Set(current.fields.map((field) => field.fieldId))
  if (!override.fieldIds.every((fieldId) => currentIds.has(fieldId))) return 'stale'
  return override.fieldIds.length === currentIds.size ? 'intentional' : 'unreviewed'
}

export function hasRiskyTypeCombo(status: RiskyTypeComboStatus): boolean {
  return status === 'unreviewed' || status === 'intentional' || status === 'stale'
}
