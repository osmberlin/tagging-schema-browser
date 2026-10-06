import { schemaRefTarget } from '@/utils/schemaRef'
import type { RawField, RawFields, RawPreset, RawPresets } from '@/utils/types'

const INHERITABLE_TYPES = new Set(['multiCombo', 'semiCombo', 'manyCombo', 'check'])
const GENERIC_TAG_VALUES = new Set(['yes', '*'])

/** Preset id from a `{path/to/preset}` template reference. */
export function presetIdFromRef(ref: string): string | null {
  return schemaRefTarget(ref)
}

function fieldKey(fieldId: string, allFields: RawFields): string {
  return allFields[fieldId]?.key ?? fieldId
}

/** Geometry types where a field can appear on a preset (iD `field.matchGeometry`). */
function effectiveFieldGeometries(field: RawField | undefined, presetGeometry: string[]): string[] {
  if (!field?.geometry || field.geometry.length === 0) return [...presetGeometry]
  if (presetGeometry.length === 0) return [...field.geometry]
  return field.geometry.filter((geometry) => presetGeometry.includes(geometry))
}

/** Whether two fields can appear on the same feature geometry for this preset. */
function fieldGeometriesOverlap(
  left: RawField | undefined,
  right: RawField | undefined,
  presetGeometry: string[],
): boolean {
  const leftGeometries = effectiveFieldGeometries(left, presetGeometry)
  const rightGeometries = effectiveFieldGeometries(right, presetGeometry)
  if (leftGeometries.length === 0 || rightGeometries.length === 0) return true
  return leftGeometries.some((geometry) => rightGeometries.includes(geometry))
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
      if (tagValue && GENERIC_TAG_VALUES.has(tagValue)) {
        const type = allFields[fieldId]?.type
        if (type && INHERITABLE_TYPES.has(type)) continue
        return true
      }
      if (tagValue !== undefined && tagValue !== null && String(tagValue).length > 0) {
        return false
      }
    }
  }

  for (const list of [hostOriginalFields, hostOriginalMoreFields]) {
    for (const hostFieldId of list) {
      if (presetIdFromRef(hostFieldId)) continue
      if (fieldKey(hostFieldId, allFields) !== key) continue
      if (
        !fieldGeometriesOverlap(
          allFields[hostFieldId],
          allFields[fieldId],
          hostPreset.geometry ?? [],
        )
      ) {
        continue
      }
      return false
    }
  }

  return true
}

function listUsesPresetRefs(list: string[] | undefined): boolean {
  return (
    Array.isArray(list) && list.some((item) => typeof item === 'string' && presetIdFromRef(item))
  )
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
  hostPresetId: string,
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

/**
 * Field ids inherited when `presetRef` appears in `fieldListKey` on the host preset.
 * Mirrors iD `Preset#resolveFields` / `shouldInherit` (fields vs moreFields context).
 */
export function getInheritedFieldItems(
  hostPresetId: string,
  hostPreset: RawPreset,
  presetRef: string,
  fieldListKey: 'fields' | 'moreFields',
  hostOriginalFields: string[],
  hostOriginalMoreFields: string[],
  rawPresets: Record<string, RawPreset>,
  allFields: RawFields,
  resolvingPresetRefs: ReadonlySet<string> = new Set(),
): string[] {
  const presetId = presetIdFromRef(presetRef)
  if (!presetId) return []
  if (resolvingPresetRefs.has(presetId)) return []

  const source = rawPresets[presetId]
  if (!source) return []

  const activeResolving = new Set(resolvingPresetRefs)
  activeResolving.add(hostPresetId)

  return resolvePresetFieldList(
    presetId,
    source,
    fieldListKey,
    rawPresets,
    allFields,
    activeResolving,
  ).filter((fieldId) =>
    shouldInheritField(hostPreset, fieldId, hostOriginalFields, hostOriginalMoreFields, allFields),
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
  resolvingPresetRefs: ReadonlySet<string> = new Set(),
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
          resolvingPresetRefs,
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
      const refPresetId = presetIdFromRef(item)
      if (!refPresetId || resolvingPresetRefs.has(refPresetId)) continue

      const activeResolving = new Set(resolvingPresetRefs)
      activeResolving.add(presetId)

      resolved.push(
        ...getInheritedFieldItems(
          presetId,
          preset,
          item,
          fieldListKey,
          hostOriginalFields,
          hostOriginalMoreFields,
          rawPresets,
          allFields,
          activeResolving,
        ),
      )
      continue
    }

    if (
      usesPresetRefs ||
      shouldIncludeDistField(
        presetId,
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
