import { describe, expect, it } from 'vitest'
import type { MissingInheritanceAuditEntry } from '@/components/PageAudits/auditEntries'
import { buildBatchSchemaOverrideIssueUrl } from '@/components/PageAudits/buildBatchOverrideIssueUrl'

const missingEntry: MissingInheritanceAuditEntry = {
  kind: 'missing-inheritance',
  entryId: 'man_made/crane/untyped_crane:fields',
  presetId: 'man_made/crane/untyped_crane',
  presetName: 'Untyped crane',
  fieldListKey: 'fields',
  status: 'unreviewed',
  parentId: 'man_made/crane',
  missedFieldIds: ['crane/type'],
  explicitPresetRefs: [],
  documentedMissedFieldIds: [],
}

describe('buildBatchSchemaOverrideIssueUrl', () => {
  it('builds a batch issue with decision labels and snapshot', () => {
    const url = buildBatchSchemaOverrideIssueUrl({
      kind: 'missing-inheritance',
      slug: 'missing-inheritance',
      entries: [missingEntry],
      decisions: { [missingEntry.entryId]: 'intentional' },
      dataUrl: '/test-schema',
    })

    const parsed = new URL(url)
    expect(parsed.searchParams.get('title')).toBe(
      '[missing-inheritance] man_made/crane/untyped_crane — intentional missing inheritance',
    )
    const body = parsed.searchParams.get('body') ?? ''
    expect(body).toContain('## Entries')
    expect(body).toContain('Intentional (false positive)')
    expect(body).toContain('## Snapshot')
    expect(body).toContain('parentId: man_made/crane')
    expect(body).toContain('Cursor override automation')
    expect(body).not.toContain('## Remove stale overrides')
  })

  it('uses remove-stale section instead of snapshot', () => {
    const staleEntry: MissingInheritanceAuditEntry = {
      ...missingEntry,
      status: 'stale',
      storedOverride: {
        fields: {
          parentId: 'man_made/crane',
          missedFieldIds: ['crane/type'],
        },
      },
    }

    const url = buildBatchSchemaOverrideIssueUrl({
      kind: 'missing-inheritance',
      slug: 'missing-inheritance',
      entries: [staleEntry],
      decisions: { [staleEntry.entryId]: 'remove_stale' },
      dataUrl: '/test-schema',
    })

    const body = new URL(url).searchParams.get('body') ?? ''
    expect(body).toContain('## Remove stale overrides')
    expect(body).toContain('Remove stale override')
    expect(body).not.toContain('## Snapshot')
    expect(parsedTitle(new URL(url))).toContain('remove stale override')
  })

  it('includes needs-work section without snapshot', () => {
    const url = buildBatchSchemaOverrideIssueUrl({
      kind: 'risky-typecombo',
      slug: 'risky-typecombo',
      entries: [
        {
          kind: 'risky-typecombo',
          entryId: 'highway/residential',
          presetId: 'highway/residential',
          presetName: 'Residential',
          status: 'unreviewed',
          riskyTypeCombo: {
            fields: [
              {
                fieldId: 'traffic_calming',
                fieldKey: 'traffic_calming',
                listKey: 'moreFields',
              },
            ],
          },
        },
      ],
      decisions: { 'highway/residential': 'needs_work' },
      dataUrl: '/test-schema',
    })

    const body = new URL(url).searchParams.get('body') ?? ''
    expect(body).toContain('## Needs upstream work')
    expect(body).not.toContain('## Snapshot')
    expect(new URL(url).searchParams.get('title')).toBe(
      '[risky-typecombo] highway/residential — needs upstream work',
    )
  })

  it('merges partial override snapshots when documenting remaining missed fields', () => {
    const entry: MissingInheritanceAuditEntry = {
      ...missingEntry,
      presetId: 'tourism/information/terminal',
      entryId: 'tourism/information/terminal:fields',
      parentId: 'tourism/information',
      missedFieldIds: ['building_area_yes'],
      documentedMissedFieldIds: ['address'],
      storedOverride: {
        fields: {
          parentId: 'tourism/information',
          missedFieldIds: ['address'],
        },
      },
    }

    const url = buildBatchSchemaOverrideIssueUrl({
      kind: 'missing-inheritance',
      slug: 'missing-inheritance',
      entries: [entry],
      decisions: { [entry.entryId]: 'intentional' },
      dataUrl: '/test-schema',
    })

    const body = new URL(url).searchParams.get('body') ?? ''
    expect(body).toContain('- address')
    expect(body).toContain('- building_area_yes')
  })

  it('throws when no entries are selected', () => {
    expect(() =>
      buildBatchSchemaOverrideIssueUrl({
        kind: 'missing-inheritance',
        slug: 'missing-inheritance',
        entries: [missingEntry],
        decisions: { [missingEntry.entryId]: 'pending' },
        dataUrl: '/test-schema',
      }),
    ).toThrow(/Select at least one entry/)
  })
})

function parsedTitle(url: URL): string {
  return url.searchParams.get('title') ?? ''
}
