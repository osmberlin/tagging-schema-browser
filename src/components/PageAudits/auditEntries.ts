import type { AuditDecision } from '@/components/PageAudits/auditDecisions'
import type { FieldListKey } from '@/components/PagePresets/missingFieldInheritance'
import {
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
  missedFieldIds: string[]
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
            missedFieldIds: listOverride?.missedFieldIds ?? [],
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
        missedFieldIds: section.missedFieldIds,
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

export function defaultAuditDecision(entry: AuditEntry): AuditDecision {
  if (entry.status === 'stale') return 'remove_stale'
  if (entry.status === 'unreviewed') return 'pending'
  return 'pending'
}

export function missingInheritanceFromEntry(
  entry: MissingInheritanceAuditEntry,
): MissingFieldInheritance | null {
  if (entry.status === 'stale' && entry.missedFieldIds.length === 0) return null
  return {
    [entry.fieldListKey]: {
      parentId: entry.parentId,
      missedFieldIds: entry.missedFieldIds,
      explicitPresetRefs: entry.explicitPresetRefs,
    },
  }
}
