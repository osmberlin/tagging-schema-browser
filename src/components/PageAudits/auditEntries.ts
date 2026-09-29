import type { FieldListKey } from '@/components/PagePresets/missingFieldInheritance'
import {
  mergeMissingInheritanceOverrideList,
  remainingMissedFieldIds,
  resolveMissingInheritanceListStatus,
  type MissingFieldInheritance,
  type MissingInheritanceOverride,
  type MissingInheritanceStatus,
} from '@/components/PagePresets/missingFieldInheritance'
import type { RiskyTypeCombo, RiskyTypeComboStatus } from '@/components/PagePresets/riskyTypeCombo'
import { missingInheritanceOverrides } from '@/data/missingInheritanceOverrides'
import { riskyTypeComboOverrides } from '@/data/riskyTypeComboOverrides'
import type { DenormalizedPreset } from '@/utils/types'
import type { AuditSlug } from './auditSlugs'

export type { AuditDecision } from '@/components/PageAudits/auditDecisions'

export type MissingInheritanceAuditEntry = {
  kind: 'missing-inheritance'
  entryId: string
  presetId: string
  presetName: string
  fieldListKey: FieldListKey
  status: MissingInheritanceStatus
  parentId: string
  /** Missed field ids that still need a decision (excludes already-documented overrides). */
  missedFieldIds: string[]
  /** Field ids already recorded in the override snapshot for this list. */
  documentedMissedFieldIds: string[]
  /** Live detection missed field ids for this list (empty when orphaned stale). */
  liveMissedFieldIds: string[]
  explicitPresetRefs: string[]
  storedOverride?: MissingInheritanceOverride
}

export type RiskyTypeComboAuditEntry = {
  kind: 'risky-typecombo'
  entryId: string
  presetId: string
  presetName: string
  status: RiskyTypeComboStatus
  riskyTypeCombo: RiskyTypeCombo
  storedOverride?: (typeof riskyTypeComboOverrides.presets)[string]
}

export type AuditEntry = MissingInheritanceAuditEntry | RiskyTypeComboAuditEntry

function missingInheritanceEntries(presets: DenormalizedPreset[]): MissingInheritanceAuditEntry[] {
  const entries: MissingInheritanceAuditEntry[] = []

  for (const preset of presets) {
    const { missingFieldInheritance, missingInheritanceStatus } = preset
    if (!missingFieldInheritance || missingInheritanceStatus === 'none') continue

    const storedOverride = missingInheritanceOverrides.presets[preset.id]

    for (const fieldListKey of ['fields', 'moreFields'] as const) {
      const section = missingFieldInheritance[fieldListKey]
      const listOverride = storedOverride?.[fieldListKey]
      const listStatus = resolveMissingInheritanceListStatus(section, listOverride)
      if (listStatus === 'none' || listStatus === 'intentional') continue
      if (!section) {
        if (listStatus === 'stale') {
          entries.push({
            kind: 'missing-inheritance',
            entryId: `${preset.id}:${fieldListKey}`,
            presetId: preset.id,
            presetName: preset.name,
            fieldListKey,
            status: 'stale',
            parentId: listOverride?.parentId ?? '',
            missedFieldIds: [],
            documentedMissedFieldIds: listOverride?.missedFieldIds ?? [],
            liveMissedFieldIds: [],
            explicitPresetRefs: [],
            storedOverride,
          })
        }
        continue
      }

      entries.push({
        kind: 'missing-inheritance',
        entryId: `${preset.id}:${fieldListKey}`,
        presetId: preset.id,
        presetName: preset.name,
        fieldListKey,
        status: listStatus,
        parentId: section.parentId,
        missedFieldIds: remainingMissedFieldIds(section, listOverride),
        documentedMissedFieldIds: listOverride?.missedFieldIds ?? [],
        liveMissedFieldIds: section.missedFieldIds,
        explicitPresetRefs: section.explicitPresetRefs,
        storedOverride,
      })
    }
  }

  return entries.sort((a, b) => a.presetId.localeCompare(b.presetId))
}

function riskyTypeComboEntries(presets: DenormalizedPreset[]): RiskyTypeComboAuditEntry[] {
  const entries: RiskyTypeComboAuditEntry[] = []

  for (const preset of presets) {
    const { riskyTypeCombo, riskyTypeComboStatus } = preset
    if (riskyTypeComboStatus === 'none') continue

    entries.push({
      kind: 'risky-typecombo',
      entryId: preset.id,
      presetId: preset.id,
      presetName: preset.name,
      status: riskyTypeComboStatus,
      riskyTypeCombo: riskyTypeCombo ?? {
        fields: (riskyTypeComboOverrides.presets[preset.id]?.fieldIds ?? []).map((fieldId) => ({
          fieldId,
          fieldKey: fieldId,
          listKey: 'fields' as const,
        })),
      },
      storedOverride: riskyTypeComboOverrides.presets[preset.id],
    })
  }

  return entries.sort((a, b) => a.presetId.localeCompare(b.presetId))
}

export function auditEntriesForSlug(slug: AuditSlug, presets: DenormalizedPreset[]): AuditEntry[] {
  if (slug === 'missing-inheritance') return missingInheritanceEntries(presets)
  return riskyTypeComboEntries(presets)
}

export function auditEntryNeedsAction(entry: AuditEntry): boolean {
  return entry.status === 'unreviewed' || entry.status === 'stale'
}

/** Documented override ids that still match live detection for this list. */
export function validDocumentedMissedFieldIds(entry: MissingInheritanceAuditEntry): string[] {
  const live = new Set(entry.liveMissedFieldIds)
  return entry.documentedMissedFieldIds.filter((fieldId) => live.has(fieldId))
}

/** Override ids no longer missing on the live preset (stale subset). */
export function invalidOverrideMissedFieldIds(entry: MissingInheritanceAuditEntry): string[] {
  const live = new Set(entry.liveMissedFieldIds)
  return entry.documentedMissedFieldIds.filter((fieldId) => !live.has(fieldId))
}

export function isOrphanedStaleMissingInheritanceEntry(
  entry: MissingInheritanceAuditEntry,
): boolean {
  return entry.status === 'stale' && entry.liveMissedFieldIds.length === 0
}

export function missingInheritanceFromEntry(
  entry: MissingInheritanceAuditEntry,
): MissingFieldInheritance | null {
  if (isOrphanedStaleMissingInheritanceEntry(entry)) return null

  const live = new Set(entry.liveMissedFieldIds)
  const validDocumented = validDocumentedMissedFieldIds(entry)

  const mergedList = mergeMissingInheritanceOverrideList(
    {
      parentId: entry.parentId,
      missedFieldIds: [...validDocumented, ...entry.missedFieldIds],
      explicitPresetRefs: entry.explicitPresetRefs,
    },
    entry.storedOverride?.[entry.fieldListKey],
    entry.missedFieldIds,
  )

  const missedFieldIds = mergedList.missedFieldIds.filter((fieldId) => live.has(fieldId))
  if (missedFieldIds.length === 0) return null

  return {
    [entry.fieldListKey]: {
      parentId: entry.parentId,
      missedFieldIds,
      explicitPresetRefs: entry.explicitPresetRefs,
    },
  }
}
