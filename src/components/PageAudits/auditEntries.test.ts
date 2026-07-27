import { describe, expect, it } from 'vitest'
import {
  defaultAuditDecision,
  invalidOverrideMissedFieldIds,
  isOrphanedStaleMissingInheritanceEntry,
  missingInheritanceFromEntry,
  validDocumentedMissedFieldIds,
  type MissingInheritanceAuditEntry,
} from '@/components/PageAudits/auditEntries'

const baseEntry: MissingInheritanceAuditEntry = {
  kind: 'missing-inheritance',
  entryId: 'tourism/information/terminal:fields',
  presetId: 'tourism/information/terminal',
  presetName: 'Terminal',
  fieldListKey: 'fields',
  status: 'unreviewed',
  parentId: 'tourism/information',
  missedFieldIds: ['building_area_yes'],
  documentedMissedFieldIds: ['address'],
  liveMissedFieldIds: ['address', 'building_area_yes'],
  explicitPresetRefs: [],
  storedOverride: {
    fields: {
      parentId: 'tourism/information',
      missedFieldIds: ['address'],
    },
  },
}

describe('auditEntries', () => {
  it('defaults every actionable row to pending', () => {
    expect(defaultAuditDecision({ ...baseEntry, status: 'stale' })).toBe('pending')
    expect(defaultAuditDecision({ ...baseEntry, status: 'unreviewed' })).toBe('pending')
  })

  it('merges valid documented and remaining ids for intentional snapshots', () => {
    expect(missingInheritanceFromEntry(baseEntry)).toEqual({
      fields: {
        parentId: 'tourism/information',
        missedFieldIds: ['address', 'building_area_yes'],
        explicitPresetRefs: [],
      },
    })
  })

  it('filters invalid override ids from intentional snapshots', () => {
    const staleEntry: MissingInheritanceAuditEntry = {
      ...baseEntry,
      status: 'stale',
      missedFieldIds: [],
      documentedMissedFieldIds: ['address', 'removed_field'],
      liveMissedFieldIds: ['address'],
    }

    expect(missingInheritanceFromEntry(staleEntry)).toEqual({
      fields: {
        parentId: 'tourism/information',
        missedFieldIds: ['address'],
        explicitPresetRefs: [],
      },
    })
    expect(invalidOverrideMissedFieldIds(staleEntry)).toEqual(['removed_field'])
    expect(validDocumentedMissedFieldIds(staleEntry)).toEqual(['address'])
  })

  it('returns null for orphaned stale entries', () => {
    const orphaned: MissingInheritanceAuditEntry = {
      ...baseEntry,
      status: 'stale',
      missedFieldIds: [],
      documentedMissedFieldIds: ['address'],
      liveMissedFieldIds: [],
    }

    expect(isOrphanedStaleMissingInheritanceEntry(orphaned)).toBe(true)
    expect(missingInheritanceFromEntry(orphaned)).toBeNull()
  })
})
