import { resolvePresetFieldList } from '@/components/PagePresets/presetFieldInheritance'
import type { RawField, RawFields, RawPreset, RawPresets } from '@/utils/types'

/** Resolved field ids for a preset (fields + moreFields, including `{preset}` inheritance). */
export function resolvePresetFieldIds(
  presetId: string,
  preset: RawPreset,
  rawPresets: RawPresets,
  allFields: RawFields,
): string[] {
  const fields = resolvePresetFieldList(presetId, preset, 'fields', rawPresets, allFields)
  const moreFields = resolvePresetFieldList(presetId, preset, 'moreFields', rawPresets, allFields)
  return [...fields, ...moreFields]
}

export function fieldMatchesGeometry(
  field: { geometry?: string[] } | undefined,
  geometry: string,
): boolean {
  if (!field?.geometry?.length) return true
  return field.geometry.includes(geometry)
}

const MULTI_COMBO_TYPES = new Set(['multiCombo'])
const SEMI_COMBO_TYPES = new Set(['semiCombo', 'manyCombo'])
const CHECK_TYPES = new Set(['check', 'onewayCheck'])

function firstOption(field: RawField): string {
  const opt = field.options?.find((o) => o !== 'undefined')
  return opt ?? 'yes'
}

function multiComboTagKey(key: string, option: string): string {
  const base = key.endsWith(':') ? key.slice(0, -1) : key
  const value = option.startsWith(':') ? option.slice(1) : option
  return `${base}:${value}`
}

function multiComboKeyPrefix(key: string): string {
  const base = key.endsWith(':') ? key.slice(0, -1) : key
  return `${base}:`
}

function tagKeyMatchesPrefix(key: string, tagKey: string): boolean {
  if (tagKey === key) return true
  return tagKey.startsWith(multiComboKeyPrefix(key))
}

/** Placeholder tags for a field — every key the field can edit is set as if the user filled it in. */
export function getAssumedTagsForField(
  fieldId: string,
  field: RawField | undefined,
): Record<string, string> {
  if (!field) return { [fieldId]: '…' }

  const type = field.type
  const value = firstOption(field)

  if (type === 'structureRadio') {
    const structureKey = field.options?.[0] ?? field.keys?.[0] ?? 'bridge'
    return { [structureKey]: 'yes' }
  }

  if (field.keys?.length) {
    const tags: Record<string, string> = {}
    for (const key of field.keys) {
      tags[key] = value
    }
    return tags
  }

  const key = field.key ?? fieldId

  if (type && SEMI_COMBO_TYPES.has(type)) {
    return { [key]: value }
  }

  if (type && MULTI_COMBO_TYPES.has(type)) {
    const tags: Record<string, string> = {}
    if (field.options?.length) {
      for (const opt of field.options) {
        if (opt === 'undefined') continue
        tags[multiComboTagKey(key, opt)] = 'yes'
      }
    }
    if (Object.keys(tags).length === 0) tags[key] = 'yes'
    return tags
  }

  if (type && CHECK_TYPES.has(type)) {
    return { [key]: 'yes' }
  }

  return { [key]: value }
}

/** Tag keys a field currently controls — mirrors a simplified iD `Field#allKeys`. */
export function getFieldTagKeys(
  fieldId: string,
  field: RawField | undefined,
  tags: Record<string, string>,
): string[] {
  if (!field) return [fieldId]

  if (field.keys?.length) {
    return field.keys.filter((key) => key in tags)
  }

  const key = field.key ?? fieldId

  if (field.type === 'structureRadio') {
    const candidates = field.keys ?? field.options ?? []
    return candidates.filter((k) => k in tags)
  }

  if (field.type && SEMI_COMBO_TYPES.has(field.type)) {
    return key in tags ? [key] : [key]
  }

  if (field.type && MULTI_COMBO_TYPES.has(field.type)) {
    return Object.keys(tags).filter((tagKey) => tagKeyMatchesPrefix(key, tagKey))
  }

  return key in tags ? [key] : [key]
}
