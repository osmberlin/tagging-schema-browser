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
  documentedMissedFieldIds: [],
  liveMissedFieldIds: ['crane/type'],
  explicitPresetRefs: [],
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
      liveMissedFieldIds: ['address', 'building_area_yes'],
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

  it('merges fields and moreFields for the same preset into one YAML block', () => {
    const fieldsEntry: MissingInheritanceAuditEntry = {
      ...missingEntry,
      presetId: 'man_made',
      entryId: 'man_made:fields',
      parentId: 'amenity',
      fieldListKey: 'fields',
      missedFieldIds: ['name'],
      liveMissedFieldIds: ['name'],
    }
    const moreFieldsEntry: MissingInheritanceAuditEntry = {
      ...missingEntry,
      presetId: 'man_made',
      entryId: 'man_made:moreFields',
      parentId: 'amenity',
      fieldListKey: 'moreFields',
      missedFieldIds: ['material'],
      liveMissedFieldIds: ['material'],
    }

    const url = buildBatchSchemaOverrideIssueUrl({
      kind: 'missing-inheritance',
      slug: 'missing-inheritance',
      entries: [fieldsEntry, moreFieldsEntry],
      decisions: {
        [fieldsEntry.entryId]: 'intentional',
        [moreFieldsEntry.entryId]: 'intentional',
      },
      dataUrl: '/test-schema',
    })

    const body = new URL(url).searchParams.get('body') ?? ''
    const yamlBlock = body.match(/```yaml\n([\s\S]*?)```/)?.[1] ?? ''
    const parsed = Bun.YAML.parse(yamlBlock) as {
      presets: Record<string, { fields?: unknown; moreFields?: unknown }>
    }

    expect(Object.keys(parsed.presets)).toEqual(['man_made'])
    expect(parsed.presets['man_made']?.fields).toBeTruthy()
    expect(parsed.presets['man_made']?.moreFields).toBeTruthy()
    expect(body.match(/man_made:/g)?.length).toBe(1)
  })

  it('filters invalid override ids from intentional snapshots for stale entries', () => {
    const staleEntry: MissingInheritanceAuditEntry = {
      ...missingEntry,
      status: 'stale',
      missedFieldIds: [],
      documentedMissedFieldIds: ['crane/type', 'removed_field'],
      liveMissedFieldIds: ['crane/type'],
      storedOverride: {
        fields: {
          parentId: 'man_made/crane',
          missedFieldIds: ['crane/type', 'removed_field'],
        },
      },
    }

    const url = buildBatchSchemaOverrideIssueUrl({
      kind: 'missing-inheritance',
      slug: 'missing-inheritance',
      entries: [staleEntry],
      decisions: { [staleEntry.entryId]: 'intentional' },
      dataUrl: '/test-schema',
    })

    const body = new URL(url).searchParams.get('body') ?? ''
    expect(body).toContain('- crane/type')
    expect(body).not.toContain('removed_field')
  })

  it('throws when intentional snapshot has no valid ids left', () => {
    const orphanedStale: MissingInheritanceAuditEntry = {
      ...missingEntry,
      status: 'stale',
      missedFieldIds: [],
      documentedMissedFieldIds: ['crane/type'],
      liveMissedFieldIds: [],
      storedOverride: {
        fields: {
          parentId: 'man_made/crane',
          missedFieldIds: ['crane/type'],
        },
      },
    }

    expect(() =>
      buildBatchSchemaOverrideIssueUrl({
        kind: 'missing-inheritance',
        slug: 'missing-inheritance',
        entries: [orphanedStale],
        decisions: { [orphanedStale.entryId]: 'intentional' },
        dataUrl: '/test-schema',
      }),
    ).toThrow(/Select at least one entry/)
  })

  it('emits list-scoped stale removal when only one list is stale', () => {
    const storedOverride = {
      fields: {
        parentId: 'amenity',
        missedFieldIds: ['name'],
      },
      moreFields: {
        parentId: 'amenity',
        missedFieldIds: ['material'],
      },
    }
    const fieldsEntry: MissingInheritanceAuditEntry = {
      ...missingEntry,
      presetId: 'man_made',
      entryId: 'man_made:fields',
      parentId: 'amenity',
      fieldListKey: 'fields',
      status: 'intentional',
      missedFieldIds: [],
      documentedMissedFieldIds: ['name'],
      liveMissedFieldIds: ['name'],
      storedOverride,
    }
    const staleMoreFieldsEntry: MissingInheritanceAuditEntry = {
      ...missingEntry,
      presetId: 'man_made',
      entryId: 'man_made:moreFields',
      parentId: 'amenity',
      fieldListKey: 'moreFields',
      status: 'stale',
      missedFieldIds: [],
      documentedMissedFieldIds: ['material'],
      liveMissedFieldIds: [],
      storedOverride,
    }

    const url = buildBatchSchemaOverrideIssueUrl({
      kind: 'missing-inheritance',
      slug: 'missing-inheritance',
      entries: [fieldsEntry, staleMoreFieldsEntry],
      decisions: { [staleMoreFieldsEntry.entryId]: 'remove_stale' },
      dataUrl: '/test-schema',
    })

    const body = new URL(url).searchParams.get('body') ?? ''
    expect(body).toContain('## Remove stale overrides')
    expect(body).toContain('Delete only the listed list keys')
    const staleYaml =
      body.match(/## Remove stale overrides[\s\S]*?```yaml\n([\s\S]*?)```/)?.[1] ?? ''
    const parsed = Bun.YAML.parse(`presets:\n${staleYaml}`) as {
      presets: Record<string, { fields?: unknown; moreFields?: unknown }>
    }

    expect(parsed.presets['man_made']?.moreFields).toBeTruthy()
    expect(parsed.presets['man_made']?.fields).toBeUndefined()
    expect(body).not.toContain('## Snapshot')
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
