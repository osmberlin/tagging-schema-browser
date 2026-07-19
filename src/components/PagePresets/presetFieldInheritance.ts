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

/** Structured reason a field is not inherited (iD `Preset#shouldInherit`). */
export type FieldInheritanceOmission =
  | {
      kind: 'presetTag'
      hostPresetId: string
      tagKey: string
      tagValue: string
    }
  | {
      kind: 'explicitField'
      hostPresetId: string
      fieldListKey: 'fields' | 'moreFields'
      blockingFieldId: string
      tagKey: string
    }
  | {
      kind: 'duplicateInFields'
      hostPresetId: string
      sourcePresetRef: string
      sourcePresetId: string
    }

type HostFieldsProvenance = Map<string, { sourcePresetRef: string; sourcePresetId: string }>

/** Format a structured inheritance omission for the source preset tree. */
export function formatFieldInheritanceOmission(
  omittedFieldId: string,
  omission: FieldInheritanceOmission,
): string {
  switch (omission.kind) {
    case 'presetTag':
      return `${omission.hostPresetId} tag fixes ${omission.tagKey}=${omission.tagValue}`
    case 'explicitField': {
      const where = `${omission.hostPresetId} (${omission.fieldListKey})`
      if (omission.blockingFieldId === omittedFieldId) {
        return `${omittedFieldId} listed explicitly on ${where}`
      }
      return `${omittedFieldId} blocked by ${omission.blockingFieldId} on ${omission.hostPresetId} (${omission.fieldListKey}, same tag key \`${omission.tagKey}\`)`
    }
    case 'duplicateInFields':
      if (omission.sourcePresetRef.startsWith('{')) {
        return `${omittedFieldId} already in fields via ${omission.sourcePresetRef}`
      }
      return `${omittedFieldId} already in fields on ${omission.hostPresetId}`
  }
}

/** Whether a resolved field id applies to this preset (iD `Preset#shouldInherit`). */
export function shouldInheritField(
  hostPresetId: string,
  hostPreset: RawPreset,
  fieldId: string,
  hostOriginalFields: string[],
  hostOriginalMoreFields: string[],
  allFields: RawFields,
): boolean {
  return (
    getFieldInheritanceOmission(
      hostPresetId,
      hostPreset,
      fieldId,
      hostOriginalFields,
      hostOriginalMoreFields,
      allFields,
    ) === null
  )
}

/** Structured reason a referenced field is not inherited, or null when it applies. */
export function getFieldInheritanceOmission(
  hostPresetId: string,
  hostPreset: RawPreset,
  fieldId: string,
  hostOriginalFields: string[],
  hostOriginalMoreFields: string[],
  allFields: RawFields,
): FieldInheritanceOmission | null {
  const key = fieldKey(fieldId, allFields)
  const tags = hostPreset.tags ?? {}

  for (const tagKey of Object.keys(tags)) {
    if (tagKey === key) {
      const tagValue = tags[tagKey]
      if (tagValue && GENERIC_TAG_VALUES.has(tagValue)) {
        const type = allFields[fieldId]?.type
        if (type && INHERITABLE_TYPES.has(type)) continue
        return null
      }
      if (tagValue !== undefined && tagValue !== null && String(tagValue).length > 0) {
        return { kind: 'presetTag', hostPresetId, tagKey, tagValue: String(tagValue) }
      }
    }
  }

  for (const [fieldListKey, list] of [
    ['fields', hostOriginalFields],
    ['moreFields', hostOriginalMoreFields],
  ] as const) {
    for (const hostFieldId of list) {
      if (presetIdFromRef(hostFieldId)) continue
      if (fieldKey(hostFieldId, allFields) === key) {
        return {
          kind: 'explicitField',
          hostPresetId,
          fieldListKey,
          blockingFieldId: hostFieldId,
          tagKey: key,
        }
      }
    }
  }

  return null
}

/** @deprecated Prefer `getFieldInheritanceOmission` + `formatFieldInheritanceOmission`. */
export function explainShouldNotInheritField(
  hostPresetId: string,
  hostPreset: RawPreset,
  fieldId: string,
  hostOriginalFields: string[],
  hostOriginalMoreFields: string[],
  allFields: RawFields,
): string | null {
  const omission = getFieldInheritanceOmission(
    hostPresetId,
    hostPreset,
    fieldId,
    hostOriginalFields,
    hostOriginalMoreFields,
    allFields,
  )
  return omission ? formatFieldInheritanceOmission(fieldId, omission) : null
}

export type PresetRefFieldInheritanceEntry =
  | { applied: true; fieldId: string }
  | { applied: false; fieldId: string; omission: FieldInheritanceOmission; reason: string }

export type PresetRefFieldListEntry =
  | {
      kind: 'field'
      fieldId: string
      applied: boolean
      omission?: FieldInheritanceOmission
      reason?: string
    }
  | { kind: 'presetRef'; presetRef: string }

/** Recursive expansion tree for a `{preset}` ref in the source preset panel. */
export type PresetRefFieldExpansionNode =
  | { kind: 'field'; fieldId: string; applied: boolean; omission?: FieldInheritanceOmission }
  | {
      kind: 'presetRef'
      presetRef: string
      presetId: string
      cyclic?: boolean
      children: PresetRefFieldExpansionNode[]
    }

/**
 * For each field id already contributed by the page preset's `fields` list,
 * record which `{preset}` ref (or literal field) introduced it.
 */
function buildHostFieldsProvenance(
  pagePresetId: string,
  rawPresets: RawPresets,
  allFields: RawFields,
): HostFieldsProvenance {
  const host = rawPresets[pagePresetId]
  if (!host) return new Map()

  const authoredFields = getAuthoredExplicitFieldIds(pagePresetId, 'fields', rawPresets)
  const authoredMoreFields = getAuthoredExplicitFieldIds(pagePresetId, 'moreFields', rawPresets)
  const provenance: HostFieldsProvenance = new Map()

  for (const item of getPresetRefDisplayFieldList(pagePresetId, 'fields', rawPresets)) {
    const refId = presetIdFromRef(item)
    if (refId) {
      for (const fieldId of getInheritedFieldItems(
        pagePresetId,
        host,
        item,
        'fields',
        authoredFields,
        authoredMoreFields,
        rawPresets,
        allFields,
      )) {
        provenance.set(fieldId, { sourcePresetRef: item, sourcePresetId: refId })
      }
      continue
    }

    if (
      shouldInheritField(pagePresetId, host, item, authoredFields, authoredMoreFields, allFields)
    ) {
      provenance.set(item, { sourcePresetRef: item, sourcePresetId: pagePresetId })
    }
  }

  return provenance
}

function getDuplicateInFieldsOmission(
  fieldId: string,
  fieldListKey: 'fields' | 'moreFields',
  pagePresetId: string,
  hostFieldsProvenance: HostFieldsProvenance | undefined,
): FieldInheritanceOmission | null {
  if (fieldListKey !== 'moreFields' || !hostFieldsProvenance) return null

  const source = hostFieldsProvenance.get(fieldId)
  if (!source) return null

  return {
    kind: 'duplicateInFields',
    hostPresetId: pagePresetId,
    sourcePresetRef: source.sourcePresetRef,
    sourcePresetId: source.sourcePresetId,
  }
}

/**
 * Build the full inheritance expansion tree for a `{preset}` ref.
 * Cycle detection happens here (not in React render).
 */
export function buildPresetRefFieldExpansion(
  inheritanceHostPresetId: string,
  presetRef: string,
  fieldListKey: 'fields' | 'moreFields',
  rawPresets: RawPresets,
  allFields: RawFields,
  expandedPresetIds: ReadonlySet<string> = new Set(),
  pagePresetId?: string,
  hostFieldsProvenance?: HostFieldsProvenance,
): PresetRefFieldExpansionNode[] {
  const presetId = presetIdFromRef(presetRef)
  if (!presetId) return []

  const inheritanceHostPreset = rawPresets[inheritanceHostPresetId]
  const referencedPreset = rawPresets[presetId]
  if (!inheritanceHostPreset || !referencedPreset) return []

  const resolvedPagePresetId = pagePresetId ?? inheritanceHostPresetId
  const resolvedHostFieldsProvenance =
    hostFieldsProvenance ?? buildHostFieldsProvenance(resolvedPagePresetId, rawPresets, allFields)

  const displayList = getPresetRefDisplayFieldList(presetId, fieldListKey, rawPresets)
  const authoredFields = getAuthoredExplicitFieldIds(inheritanceHostPresetId, 'fields', rawPresets)
  const authoredMoreFields = getAuthoredExplicitFieldIds(
    inheritanceHostPresetId,
    'moreFields',
    rawPresets,
  )

  const activeExpansion = new Set(expandedPresetIds)
  activeExpansion.add(inheritanceHostPresetId)
  activeExpansion.add(presetId)

  const nodes: PresetRefFieldExpansionNode[] = []

  for (const item of displayList) {
    const nestedPresetId = presetIdFromRef(item)
    if (nestedPresetId) {
      if (activeExpansion.has(nestedPresetId)) {
        nodes.push({
          kind: 'presetRef',
          presetRef: item,
          presetId: nestedPresetId,
          cyclic: true,
          children: [],
        })
        continue
      }

      nodes.push({
        kind: 'presetRef',
        presetRef: item,
        presetId: nestedPresetId,
        children: buildPresetRefFieldExpansion(
          presetId,
          item,
          fieldListKey,
          rawPresets,
          allFields,
          activeExpansion,
          resolvedPagePresetId,
          resolvedHostFieldsProvenance,
        ),
      })
      continue
    }

    const omission =
      getDuplicateInFieldsOmission(
        item,
        fieldListKey,
        resolvedPagePresetId,
        resolvedHostFieldsProvenance,
      ) ??
      getFieldInheritanceOmission(
        inheritanceHostPresetId,
        inheritanceHostPreset,
        item,
        authoredFields,
        authoredMoreFields,
        allFields,
      )
    nodes.push(
      omission
        ? { kind: 'field', fieldId: item, applied: false, omission }
        : { kind: 'field', fieldId: item, applied: true },
    )
  }

  return nodes
}

/**
 * Immediate children when a `{preset}` ref is expanded (single level, no nesting).
 * Prefer `buildPresetRefFieldExpansion` for the source tree.
 */
export function getPresetRefFieldListEntries(
  inheritanceHostPresetId: string,
  inheritanceHostPreset: RawPreset,
  presetRef: string,
  fieldListKey: 'fields' | 'moreFields',
  rawPresets: RawPresets,
  allFields: RawFields,
): PresetRefFieldListEntry[] {
  return buildPresetRefFieldExpansion(
    inheritanceHostPresetId,
    presetRef,
    fieldListKey,
    rawPresets,
    allFields,
  ).map((node) =>
    node.kind === 'presetRef'
      ? { kind: 'presetRef', presetRef: node.presetRef }
      : {
          kind: 'field',
          fieldId: node.fieldId,
          applied: node.applied,
          omission: node.omission,
          reason: node.omission
            ? formatFieldInheritanceOmission(node.fieldId, node.omission)
            : undefined,
        },
  )
}

function collectReferencedPresetFieldIds(
  preset: RawPreset,
  fieldListKey: 'fields' | 'moreFields',
  rawPresets: RawPresets,
  seenPresetRefs: Set<string>,
): string[] {
  const list = preset[fieldListKey]
  if (!Array.isArray(list)) return []

  const fieldIds: string[] = []

  for (const item of list) {
    if (typeof item !== 'string') continue

    const nestedPresetId = presetIdFromRef(item)
    if (nestedPresetId) {
      if (seenPresetRefs.has(nestedPresetId)) continue
      const nested = rawPresets[nestedPresetId]
      if (!nested) continue

      seenPresetRefs.add(nestedPresetId)
      fieldIds.push(
        ...collectReferencedPresetFieldIds(nested, fieldListKey, rawPresets, seenPresetRefs),
      )
      seenPresetRefs.delete(nestedPresetId)
      continue
    }

    fieldIds.push(item)
  }

  return fieldIds
}

/** Display field list for a referenced preset (`fields` or `moreFields`). */
export function getPresetRefDisplayFieldList(
  presetId: string,
  fieldListKey: 'fields' | 'moreFields',
  rawPresets: RawPresets,
): string[] {
  const preset = rawPresets[presetId]
  if (!preset) return []
  const list = preset[fieldListKey]
  if (!Array.isArray(list)) return []
  return displayPresetFieldList(presetId, fieldListKey, list, rawPresets)
}

/**
 * Literal field ids authored on a preset (excludes `{preset}` refs).
 * Matches iD `originalFields` / `originalMoreFields` used by `shouldInherit`.
 */
export function getAuthoredExplicitFieldIds(
  presetId: string,
  fieldListKey: 'fields' | 'moreFields',
  rawPresets: RawPresets,
): string[] {
  return getPresetRefDisplayFieldList(presetId, fieldListKey, rawPresets).filter(
    (item) => !presetIdFromRef(item),
  )
}

/**
 * Applied vs omitted fields when a `{preset}` ref is expanded (flat, all nested levels).
 */
export function getPresetRefFieldInheritanceBreakdown(
  inheritanceHostPresetId: string,
  inheritanceHostPreset: RawPreset,
  presetRef: string,
  fieldListKey: 'fields' | 'moreFields',
  rawPresets: RawPresets,
  allFields: RawFields,
): PresetRefFieldInheritanceEntry[] {
  const presetId = presetIdFromRef(presetRef)
  if (!presetId) return []

  const source = rawPresets[presetId]
  if (!source) return []

  const authoredFields = getAuthoredExplicitFieldIds(inheritanceHostPresetId, 'fields', rawPresets)
  const authoredMoreFields = getAuthoredExplicitFieldIds(
    inheritanceHostPresetId,
    'moreFields',
    rawPresets,
  )

  return collectReferencedPresetFieldIds(source, fieldListKey, rawPresets, new Set()).map(
    (fieldId) => {
      const omission = getFieldInheritanceOmission(
        inheritanceHostPresetId,
        inheritanceHostPreset,
        fieldId,
        authoredFields,
        authoredMoreFields,
        allFields,
      )
      return omission
        ? {
            applied: false,
            fieldId,
            omission,
            reason: formatFieldInheritanceOmission(fieldId, omission),
          }
        : { applied: true, fieldId }
    },
  )
}

function listUsesPresetRefs(list: string[] | undefined): boolean {
  return (
    Array.isArray(list) && list.some((item) => typeof item === 'string' && presetIdFromRef(item))
  )
}

function fieldListsMatch(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function isDistExpandedFieldList(list: string[]): boolean {
  return list.length > 0 && list.every((item) => typeof item === 'string' && !presetIdFromRef(item))
}

/** Longest dist-expanded preset whose field list is a prefix of `list`. */
function findDistExpandedPresetRefPrefix(
  list: string[],
  fieldListKey: 'fields' | 'moreFields',
  rawPresets: RawPresets,
  excludePresetId: string,
  preferPresetIds: string[] = [],
): { presetId: string; prefixLength: number } | null {
  const matches: Array<{
    presetId: string
    prefixLength: number
    isTemplate: boolean
    isExact: boolean
    isPreferred: boolean
  }> = []

  for (const [candidateId, candidate] of Object.entries(rawPresets)) {
    if (candidateId === excludePresetId) continue

    const candidateList = candidate[fieldListKey]
    if (!Array.isArray(candidateList) || candidateList.length === 0) continue
    if (!isDistExpandedFieldList(candidateList)) continue
    if (list.length < candidateList.length) continue

    const prefix = list.slice(0, candidateList.length)
    if (!fieldListsMatch(prefix, candidateList)) continue

    matches.push({
      presetId: candidateId,
      prefixLength: candidateList.length,
      isTemplate: candidateId.startsWith('@templates/'),
      isExact: candidateList.length === list.length,
      isPreferred: preferPresetIds.includes(candidateId),
    })
  }

  if (matches.length === 0) return null

  const preferred = matches.filter((match) => match.isPreferred)
  if (preferred.length === 1) {
    const match = preferred[0]
    return { presetId: match.presetId, prefixLength: match.prefixLength }
  }

  // Whole-list dist expansion of a template (e.g. olive_grove moreFields → {@templates/contact}).
  const exactTemplateMatches = matches.filter((match) => match.isExact && match.isTemplate)
  if (exactTemplateMatches.length === 1) {
    const match = exactTemplateMatches[0]
    return { presetId: match.presetId, prefixLength: match.prefixLength }
  }

  // Unambiguous whole-list match to another preset (never for @templates/* hosts — contact
  // and olive_grove share the same dist-expanded contact fields).
  if (!excludePresetId.startsWith('@templates/')) {
    const exactNonTemplateMatches = matches.filter((match) => match.isExact && !match.isTemplate)
    if (exactNonTemplateMatches.length === 1) {
      const match = exactNonTemplateMatches[0]
      return { presetId: match.presetId, prefixLength: match.prefixLength }
    }
  }

  // Partial prefix only — never map one preset's full field list onto an unrelated preset.
  const templateMatches = matches.filter((match) => match.isTemplate && !match.isExact)
  if (templateMatches.length > 0) {
    const best = templateMatches.reduce((left, right) =>
      right.prefixLength > left.prefixLength ? right : left,
    )
    return { presetId: best.presetId, prefixLength: best.prefixLength }
  }

  const partialMatches = matches.filter((match) => !match.isExact)
  if (partialMatches.length === 0) return null

  const maxLength = Math.max(...partialMatches.map((match) => match.prefixLength))
  const longest = partialMatches.filter((match) => match.prefixLength === maxLength)
  if (longest.length !== 1) return null

  const match = longest[0]
  return { presetId: match.presetId, prefixLength: match.prefixLength }
}

function collapseDistExpandedPresetRefs(
  presetId: string,
  fieldListKey: 'fields' | 'moreFields',
  list: string[],
  rawPresets: RawPresets,
  preferPresetIds: string[] = [],
): string[] {
  let result = list
  let changed = true

  while (changed) {
    changed = false

    const startMatch = findDistExpandedPresetRefPrefix(
      result,
      fieldListKey,
      rawPresets,
      presetId,
      preferPresetIds,
    )
    if (startMatch) {
      result = [`{${startMatch.presetId}}`, ...result.slice(startMatch.prefixLength)]
      changed = true
      continue
    }

    for (let index = 0; index < result.length; index++) {
      if (!presetIdFromRef(result[index] ?? '')) continue
      const suffix = result.slice(index + 1)
      if (suffix.length === 0) break

      const suffixMatch = findDistExpandedPresetRefPrefix(
        suffix,
        fieldListKey,
        rawPresets,
        presetId,
        preferPresetIds,
      )
      if (suffixMatch) {
        result = [
          ...result.slice(0, index + 1),
          `{${suffixMatch.presetId}}`,
          ...suffix.slice(suffixMatch.prefixLength),
        ]
        changed = true
        break
      }
    }
  }

  return result
}

/**
 * Collapse dist-expanded slash-parent field prefixes back to `{ancestor}` refs for
 * source-tree display (e.g. `traffic_sign/variable_message` shows `{traffic_sign}`).
 * Also collapses dist-expanded non-slash preset refs (e.g. `amenity/coworking_space`
 * shows `{office/coworking}`).
 */
export function displayPresetFieldList(
  presetId: string,
  fieldListKey: 'fields' | 'moreFields',
  list: string[] | undefined,
  rawPresets: RawPresets,
): string[] {
  if (!Array.isArray(list)) return []
  if (listUsesPresetRefs(list)) return list

  const preset = rawPresets[presetId]
  const preferPresetIds =
    fieldListKey === 'moreFields' && preset
      ? displayPresetFieldList(
          presetId,
          'fields',
          Array.isArray(preset.fields) ? preset.fields : undefined,
          rawPresets,
        )
          .map((item) => presetIdFromRef(item))
          .filter((id): id is string => id !== null)
      : []

  const parts = presetId.split('/')
  for (let depth = parts.length - 1; depth > 0; depth--) {
    const ancestorId = parts.slice(0, depth).join('/')
    const ancestorFields = rawPresets[ancestorId]?.[fieldListKey]
    if (!Array.isArray(ancestorFields) || ancestorFields.length === 0) continue
    if (list.length < ancestorFields.length) continue

    const prefix = list.slice(0, ancestorFields.length)
    if (!fieldListsMatch(prefix, ancestorFields)) continue

    const collapsed = [`{${ancestorId}}`, ...list.slice(ancestorFields.length)]
    return collapseDistExpandedPresetRefs(
      presetId,
      fieldListKey,
      collapsed,
      rawPresets,
      preferPresetIds,
    )
  }

  return collapseDistExpandedPresetRefs(presetId, fieldListKey, list, rawPresets, preferPresetIds)
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
  if (
    shouldInheritField(hostPresetId, hostPreset, fieldId, explicitFieldIdsInList, [], allFields)
  ) {
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
): string[] {
  const presetId = presetIdFromRef(presetRef)
  if (!presetId) return []

  const source = rawPresets[presetId]
  if (!source) return []

  return resolvePresetFieldList(presetId, source, fieldListKey, rawPresets, allFields).filter(
    (fieldId) =>
      shouldInheritField(
        hostPresetId,
        hostPreset,
        fieldId,
        hostOriginalFields,
        hostOriginalMoreFields,
        allFields,
      ),
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
            presetId,
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
          presetId,
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
