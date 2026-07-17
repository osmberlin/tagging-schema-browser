import { describe, expect, it } from 'vitest'
import {
  buildMissingInheritanceOverrideIssueUrl,
  buildSchemaOverrideIssueUrl,
  formatSchemaOverrideIssueBody,
  SCHEMA_OVERRIDE_ATTRIBUTION_BANNER,
} from '@/utils/schemaOverrideIssue'

const sampleInheritance = {
  fields: {
    parentId: 'man_made/crane',
    missedFieldIds: ['crane/type'],
    explicitPresetRefs: [],
  },
}

describe('formatSchemaOverrideIssueBody', () => {
  it('includes attribution, preset context, and YAML snapshot', () => {
    const body = formatSchemaOverrideIssueBody({
      kind: 'missing-inheritance',
      presetId: 'man_made/crane/untyped_crane',
      snapshotYaml: `  man_made/crane/untyped_crane:
    fields:
      parentId: man_made/crane
      missedFieldIds:
        - crane/type`,
      pageUrl: 'https://example.test/preset/man_made/crane/untyped_crane?dataUrl=/test-schema',
      dataUrl: '/test-schema',
    })

    expect(body).toContain(SCHEMA_OVERRIDE_ATTRIBUTION_BANNER)
    expect(body).toContain('`man_made/crane/untyped_crane`')
    expect(body).toContain('`/test-schema`')
    expect(body).toContain('open preset detail')
    expect(body).toContain('apply-schema-override/SKILL.md')
    expect(body).toContain('man_made/crane/untyped_crane:')
    expect(body).toContain('crane/type')
  })

  it('includes stale stored override when provided', () => {
    const body = formatSchemaOverrideIssueBody({
      kind: 'missing-inheritance',
      presetId: 'shop/pasta',
      snapshotYaml: `  shop/pasta:
    fields:
      parentId: shop
      missedFieldIds:
        - name`,
      pageUrl: 'https://example.test/preset/shop/pasta',
      dataUrl: 'https://cdn.example/dist',
      staleOverrideYaml: `  shop/pasta:
    fields:
      parentId: shop
      missedFieldIds:
        - address`,
    })

    expect(body).toContain('## Stale override (stored)')
    expect(body).toContain('- address')
    expect(body).toContain('## YAML snapshot (current detection)')
    expect(body).toContain('- name')
  })
})

describe('buildSchemaOverrideIssueUrl', () => {
  it('builds a GitHub new-issue URL with template, title, and body', () => {
    const url = buildSchemaOverrideIssueUrl({
      kind: 'missing-inheritance',
      presetId: 'man_made/adit',
      snapshotYaml: '  man_made/adit:\n    moreFields:\n      parentId: man_made',
      pageUrl: 'https://example.test/preset/man_made/adit',
      dataUrl: '/test-schema',
    })

    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe(
      'https://github.com/osmberlin/tagging-schema-browser/issues/new',
    )
    expect(parsed.searchParams.get('template')).toBe('missing-inheritance-override.md')
    expect(parsed.searchParams.get('title')).toBe('[Missing inheritance override] man_made/adit')
    expect(parsed.searchParams.get('body')).toContain('man_made/adit')
  })
})

describe('buildMissingInheritanceOverrideIssueUrl', () => {
  it('formats snapshot from live missing inheritance detection', () => {
    const url = buildMissingInheritanceOverrideIssueUrl({
      presetId: 'man_made/crane/untyped_crane',
      missingFieldInheritance: sampleInheritance,
      pageUrl: 'https://example.test/preset/man_made/crane/untyped_crane',
      dataUrl: '/test-schema',
    })

    const decoded = decodeURIComponent(url.replace(/\+/g, ' '))
    expect(decoded).toContain('parentId: man_made/crane')
    expect(decoded).toContain('crane/type')
  })
})
