import type { RawFields, RawPreset, RawPresets } from '@/utils/types'

const INHERITABLE_TYPES = new Set(['multiCombo', 'semiCombo', 'manyCombo', 'check'])
const GENERIC_TAG_VALUES = new Set(['yes', '*'])

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
      const tagValue = tags[tagKey]
      if (tagValue && GENERIC_TAG_VALUES.has(tagValue)) return true
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

function listUsesPresetRefs(list: string[] | undefined): boolean {
  return (
    Array.isArray(list) && list.some((item) => typeof item === 'string' && presetIdFromRef(item))
  )
}

function fieldListsMatch(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

/**
 * Collapse dist-expanded slash-parent field prefixes back to `{ancestor}` refs for
 * source-tree display (e.g. `traffic_sign/variable_message` shows `{traffic_sign}`).
 */
export function displayPresetFieldList(
  presetId: string,
  fieldListKey: 'fields' | 'moreFields',
  list: string[] | undefined,
  rawPresets: RawPresets,
): string[] {
  if (!Array.isArray(list)) return []
  if (listUsesPresetRefs(list)) return list

  const parts = presetId.split('/')
  for (let depth = parts.length - 1; depth > 0; depth--) {
    const ancestorId = parts.slice(0, depth).join('/')
    const ancestorFields = rawPresets[ancestorId]?.[fieldListKey]
    if (!Array.isArray(ancestorFields) || ancestorFields.length === 0) continue
    if (list.length < ancestorFields.length) continue

    const prefix = list.slice(0, ancestorFields.length)
    if (!fieldListsMatch(prefix, ancestorFields)) continue

    return [`{${ancestorId}}`, ...list.slice(ancestorFields.length)]
  }

  return list
}

/** Indices of fields expanded from ancestor `{preset}` blocks in v7 dist output. */
function getDistInheritedFieldIndices(
  presetId: string,
  fieldListKey: 'fields' | 'moreFields',
  hostFields: string[],
  rawPresets: RawPresets,
): Set<number> {
  const inherited = new Set<number>()
  if (hostFields.length === 0) return inherited

  const parts = presetId.split('/')
  for (let depth = parts.length - 1; depth > 0; depth--) {
    const ancestorId = parts.slice(0, depth).join('/')
    const ancestor = rawPresets[ancestorId]
    const ancestorFields = ancestor?.[fieldListKey]
    if (!Array.isArray(ancestorFields) || ancestorFields.length === 0) continue
    markSubsequenceMatches(hostFields, ancestorFields, inherited)
  }

  return inherited
}

function markSubsequenceMatches(haystack: string[], needle: string[], out: Set<number>): void {
  if (needle.length === 0) return

  for (let i = 0; i <= haystack.length - needle.length; i++) {
    let matches = true
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        matches = false
        break
      }
    }
    if (!matches) continue
    for (let j = 0; j < needle.length; j++) out.add(i + j)
  }
}

function explicitDistFieldIds(fieldList: string[], inheritedIndices: Set<number>): string[] {
  return fieldList.filter((_, index) => !inheritedIndices.has(index))
}

function shouldIncludeDistField(
  hostPreset: RawPreset,
  fieldId: string,
  fieldIndex: number,
  inheritedIndices: Set<number>,
  explicitFieldIdsInList: string[],
  allFields: RawFields,
): boolean {
  if (shouldInheritField(hostPreset, fieldId, explicitFieldIdsInList, [], allFields)) {
    return true
  }
  return !inheritedIndices.has(fieldIndex)
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
  const usesPresetRefs =
    listUsesPresetRefs(list) ||
    listUsesPresetRefs(hostOriginalFields) ||
    listUsesPresetRefs(hostOriginalMoreFields)
  const inheritedIndices = usesPresetRefs
    ? null
    : getDistInheritedFieldIndices(presetId, fieldListKey, list, rawPresets)
  const explicitFieldIdsInList = usesPresetRefs
    ? (fieldListKey === 'fields' ? hostOriginalFields : hostOriginalMoreFields).filter(
        (fieldId) => !presetIdFromRef(fieldId),
      )
    : explicitDistFieldIds(list, inheritedIndices ?? new Set())

  const resolved: string[] = []

  for (let index = 0; index < list.length; index++) {
    const item = list[index]
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

    if (
      usesPresetRefs ||
      shouldIncludeDistField(
        preset,
        item,
        index,
        inheritedIndices ?? new Set(),
        explicitFieldIdsInList,
        allFields,
      )
    ) {
      resolved.push(item)
    }
  }

  return resolved
}
