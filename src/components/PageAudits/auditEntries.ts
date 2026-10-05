import type { AuditFieldState } from '@/components/PageAudits/auditDecisions'
import type { AuditSlug } from '@/components/PageAudits/auditSlugs'
import type { FieldListKey } from '@/components/PagePresets/missingFieldInheritance'
import { labelMismatchOverrides } from '@/data/labelMismatchOverrides'
import { missingInheritanceOverrides } from '@/data/missingInheritanceOverrides'
import { riskyTypeComboOverrides } from '@/data/riskyTypeComboOverrides'
import {
  staleLabelMismatchOverrides,
  type LabelMismatchKind,
  type LabelMismatchPair,
} from '@/utils/labelMismatch'
import type { DenormalizedPreset } from '@/utils/types'

/** Label mismatch only: the option ↔ preset pair behind an audit item. */
export type AuditLabelPair = {
  optionValue: string
  childPresetId: string
  optionLabel: string
  childPresetName: string
  /** Absent on stale override entries. */
  kind?: LabelMismatchKind
  /** Labels the override was reviewed with, when they changed since. */
  previous?: { optionLabel: string; presetName: string }
}

export type AuditField = {
  /** Item id within the row. Label mismatch: `option|childPresetId`, see `labelPair`. */
  fieldId: string
  state: AuditFieldState
  /** Risky typeCombo only: the OSM key that may be written as `key=yes`. */
  fieldKey?: string
  /** Label mismatch only. */
  labelPair?: AuditLabelPair
}

/**
 * One audit row: a preset (risky typeCombo), one field list of a preset (missing inheritance) or
 * one field of a preset whose options lead to child presets (label mismatch).
 */
export type AuditEntry = {
  kind: AuditSlug
  entryId: string
  presetId: string
  presetName: string
  /** Missing inheritance only. */
  listKey?: FieldListKey
  /** Missing inheritance only. */
  parentId?: string
  /** Missing inheritance only. Falls back to the id when the parent preset is unknown. */
  parentName?: string
  /** Label mismatch only: the field whose options are listed. */
  optionFieldId?: string
  /** Fields that need a decision. */
  fields: AuditField[]
  /** Already documented in the override file and still valid. */
  documentedFieldIds: string[]
  explicitPresetRefs: string[]
}

function splitFields(liveIds: string[], documentedIds: string[]) {
  const live = new Set(liveIds)
  const documented = new Set(documentedIds)
  return {
    documentedFieldIds: documentedIds.filter((id) => live.has(id)),
    missing: liveIds.filter((id) => !documented.has(id)),
    stale: documentedIds.filter((id) => !live.has(id)),
  }
}

function toFields(missing: string[], stale: string[]): AuditField[] {
  return [
    ...missing.map((fieldId) => ({ fieldId, state: 'missing' as const })),
    ...stale.map((fieldId) => ({ fieldId, state: 'stale' as const })),
  ]
}

/** Presets plus override-only ids whose preset no longer exists in the schema. */
function presetsWithOverrides(
  presets: DenormalizedPreset[],
  overridePresetIds: string[],
): { id: string; name: string; preset?: DenormalizedPreset }[] {
  const known = new Set(presets.map((preset) => preset.id))
  return [
    ...presets.map((preset) => ({ id: preset.id, name: preset.name, preset })),
    ...overridePresetIds.filter((id) => !known.has(id)).map((id) => ({ id, name: id })),
  ]
}

function missingInheritanceEntries(presets: DenormalizedPreset[]): AuditEntry[] {
  const overrides = missingInheritanceOverrides.presets
  const presetNames = new Map(presets.map((preset) => [preset.id, preset.name]))
  const entries: AuditEntry[] = []

  for (const { id, name, preset } of presetsWithOverrides(presets, Object.keys(overrides))) {
    for (const listKey of ['fields', 'moreFields'] as const) {
      const live = preset?.missingFieldInheritance?.[listKey]
      const override = overrides[id]?.[listKey]
      if (!live && !override) continue

      const parentId = live?.parentId ?? override?.parentId ?? ''
      // A different parent invalidates every documented id.
      const documentedIds =
        override && override.parentId === parentId ? override.missedFieldIds : []
      const { documentedFieldIds, missing, stale } = splitFields(
        live?.missedFieldIds ?? [],
        documentedIds,
      )
      const staleIds = override && override.parentId !== parentId ? override.missedFieldIds : stale
      const fields = toFields(missing, staleIds)
      if (fields.length === 0) continue

      entries.push({
        kind: 'missing-inheritance',
        entryId: `${id}:${listKey}`,
        presetId: id,
        presetName: name,
        listKey,
        parentId,
        parentName: presetNames.get(parentId) ?? parentId,
        fields,
        documentedFieldIds,
        explicitPresetRefs: live?.explicitPresetRefs ?? [],
      })
    }
  }

  return entries.sort((a, b) => a.entryId.localeCompare(b.entryId))
}

function riskyTypeComboEntries(presets: DenormalizedPreset[]): AuditEntry[] {
  const overrides = riskyTypeComboOverrides.presets
  const entries: AuditEntry[] = []

  for (const { id, name, preset } of presetsWithOverrides(presets, Object.keys(overrides))) {
    const liveFields = preset?.riskyTypeCombo?.fields ?? []
    const { documentedFieldIds, missing, stale } = splitFields(
      liveFields.map((field) => field.fieldId),
      overrides[id]?.fieldIds ?? [],
    )
    const fields = toFields(missing, stale).map((field) => ({
      ...field,
      fieldKey: liveFields.find((live) => live.fieldId === field.fieldId)?.fieldKey,
    }))
    if (fields.length === 0) continue

    entries.push({
      kind: 'risky-typecombo',
      entryId: id,
      presetId: id,
      presetName: name,
      fields,
      documentedFieldIds,
      explicitPresetRefs: [],
    })
  }

  return entries.sort((a, b) => a.entryId.localeCompare(b.entryId))
}

export function labelPairItemId(optionValue: string, childPresetId: string): string {
  return `${optionValue}|${childPresetId}`
}

function labelMismatchEntries(
  presets: DenormalizedPreset[],
  pairs: Map<string, LabelMismatchPair>,
): AuditEntry[] {
  const presetNames = new Map(presets.map((preset) => [preset.id, preset.name]))
  const entries = new Map<string, AuditEntry>()
  const entryFor = (presetId: string, fieldId: string): AuditEntry => {
    const entryId = `${presetId}:${fieldId}`
    const entry = entries.get(entryId) ?? {
      kind: 'label-mismatch',
      entryId,
      presetId,
      presetName: presetNames.get(presetId) ?? presetId,
      optionFieldId: fieldId,
      fields: [],
      documentedFieldIds: [],
      explicitPresetRefs: [],
    }
    entries.set(entryId, entry)
    return entry
  }

  for (const pair of pairs.values()) {
    // Listed once, under the first preset that offers the option.
    const entry = entryFor(pair.parentPresets[0]!.id, pair.fieldId)
    if (pair.reviewed) {
      entry.documentedFieldIds.push(pair.optionValue)
      continue
    }
    entry.fields.push({
      fieldId: labelPairItemId(pair.optionValue, pair.childPresetId),
      state: 'missing',
      labelPair: {
        optionValue: pair.optionValue,
        childPresetId: pair.childPresetId,
        optionLabel: pair.optionLabel,
        childPresetName: pair.childPresetName,
        kind: pair.kind,
        previous: pair.previous,
      },
    })
  }

  for (const stale of staleLabelMismatchOverrides(pairs, labelMismatchOverrides)) {
    const parentId = stale.preset.includes('/')
      ? stale.preset.slice(0, stale.preset.lastIndexOf('/'))
      : stale.preset
    entryFor(parentId, stale.fieldId).fields.push({
      fieldId: labelPairItemId(stale.option, stale.preset),
      state: 'stale',
      labelPair: {
        optionValue: stale.option,
        childPresetId: stale.preset,
        optionLabel: stale.optionLabel,
        childPresetName: stale.presetName,
      },
    })
  }

  return [...entries.values()]
    .filter((entry) => entry.fields.length > 0)
    .sort((a, b) => a.entryId.localeCompare(b.entryId))
}

/** Rows that still need a decision (undocumented or stale fields). */
export function auditEntriesForSlug(
  slug: AuditSlug,
  presets: DenormalizedPreset[],
  labelMismatchPairs: Map<string, LabelMismatchPair>,
): AuditEntry[] {
  if (slug === 'label-mismatch') return labelMismatchEntries(presets, labelMismatchPairs)
  return slug === 'missing-inheritance'
    ? missingInheritanceEntries(presets)
    : riskyTypeComboEntries(presets)
}
