import type { RawFields, RawPreset, RawPresets } from '@/utils/types'

const INHERITABLE_TYPES = new Set(['multiCombo', 'semiCombo', 'manyCombo', 'check'])

/** Preset id from a `{path/to/preset}` template reference. */
export function presetIdFromRef(ref: string): string | null {
  const match = /^\{([^}]+)\}$/.exec(ref)
  return match ? match[1] : null
}

function fieldKey(fieldId: string, allFields: RawFields): string {
  return allFields[fieldId]?.key ?? fieldId
}

/** Whether a resolved field id applies to this preset (iD `Preset#shouldInherit`). */
export function shouldInheritField(
  hostPreset: RawPreset,
  fieldId: string,
  hostOriginalFields: string[],
  hostOriginalMoreFields: string[],
  allFields: RawFields,
): boolean {
  const key = fieldKey(fieldId, allFields)
  const tags = hostPreset.tags ?? {}

  for (const tagKey of Object.keys(tags)) {
    if (tagKey === key) {
      const type = allFields[fieldId]?.type
      if (type && INHERITABLE_TYPES.has(type)) continue
      return false
    }
  }

  for (const hostFieldId of [...hostOriginalFields, ...hostOriginalMoreFields]) {
    if (presetIdFromRef(hostFieldId)) continue
    if (fieldKey(hostFieldId, allFields) === key) return false
  }

  return true
}

function resolveInheritedFieldList(
  preset: RawPreset,
  fieldListKey: 'fields' | 'moreFields',
  hostPreset: RawPreset,
  hostOriginalFields: string[],
  hostOriginalMoreFields: string[],
  rawPresets: Record<string, RawPreset>,
  allFields: RawFields,
  seenPresetRefs: Set<string>,
): string[] {
  const list = preset[fieldListKey]
  if (!Array.isArray(list)) return []

  const resolved: string[] = []

  for (const item of list) {
    if (typeof item !== 'string') continue

    const nestedPresetId = presetIdFromRef(item)
    if (nestedPresetId) {
      if (seenPresetRefs.has(nestedPresetId)) continue
      const nested = rawPresets[nestedPresetId]
      if (!nested) continue

      seenPresetRefs.add(nestedPresetId)
      resolved.push(
        ...resolveInheritedFieldList(
          nested,
          fieldListKey,
          hostPreset,
          hostOriginalFields,
          hostOriginalMoreFields,
          rawPresets,
          allFields,
          seenPresetRefs,
        ),
      )
      seenPresetRefs.delete(nestedPresetId)
      continue
    }

    if (
      !shouldInheritField(hostPreset, item, hostOriginalFields, hostOriginalMoreFields, allFields)
    ) {
      continue
    }
    resolved.push(item)
  }

  return resolved
}

/**
 * Field ids inherited when `presetRef` appears in `fieldListKey` on the host preset.
 * Mirrors iD `Preset#resolveFields` / `shouldInherit` (fields vs moreFields context).
 */
export function getInheritedFieldItems(
  hostPreset: RawPreset,
  presetRef: string,
  fieldListKey: 'fields' | 'moreFields',
  hostOriginalFields: string[],
  hostOriginalMoreFields: string[],
  rawPresets: Record<string, RawPreset>,
  allFields: RawFields,
): string[] {
  const presetId = presetIdFromRef(presetRef)
  if (!presetId) return []

  const source = rawPresets[presetId]
  if (!source) return []

  return resolveInheritedFieldList(
    source,
    fieldListKey,
    hostPreset,
    hostOriginalFields,
    hostOriginalMoreFields,
    rawPresets,
    allFields,
    new Set(),
  )
}

/**
 * Resolved field ids for one preset field list (`fields` or `moreFields`), including
 * slash-parent fallback, `{preset}` inheritance, and iD `shouldInherit` filtering.
 */
export function resolvePresetFieldList(
  presetId: string,
  preset: RawPreset,
  fieldListKey: 'fields' | 'moreFields',
  rawPresets: RawPresets,
  allFields: RawFields,
): string[] {
  const list = preset[fieldListKey]
  if (!Array.isArray(list)) {
    const endIndex = presetId.lastIndexOf('/')
    if (endIndex > 0) {
      const parentId = presetId.substring(0, endIndex)
      const parent = rawPresets[parentId]
      if (parent) {
        const inherited = resolvePresetFieldList(
          parentId,
          parent,
          fieldListKey,
          rawPresets,
          allFields,
        )
        const hostOriginalFields = Array.isArray(preset.fields) ? preset.fields : []
        const hostOriginalMoreFields = Array.isArray(preset.moreFields) ? preset.moreFields : []
        return inherited.filter((fieldId) =>
          shouldInheritField(
            preset,
            fieldId,
            hostOriginalFields,
            hostOriginalMoreFields,
            allFields,
          ),
        )
      }
    }
    return []
  }

  const hostOriginalFields = Array.isArray(preset.fields) ? preset.fields : []
  const hostOriginalMoreFields = Array.isArray(preset.moreFields) ? preset.moreFields : []

  const resolved: string[] = []

  for (const item of list) {
    if (typeof item !== 'string') continue

    if (presetIdFromRef(item)) {
      resolved.push(
        ...getInheritedFieldItems(
          preset,
          item,
          fieldListKey,
          hostOriginalFields,
          hostOriginalMoreFields,
          rawPresets,
          allFields,
        ),
      )
      continue
    }

    resolved.push(item)
  }

  return resolved
}
