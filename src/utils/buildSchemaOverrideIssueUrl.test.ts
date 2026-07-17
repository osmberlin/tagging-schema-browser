import { describe, expect, it } from 'vitest'
import {
  buildMissingInheritanceOverrideIssueUrl,
  buildSchemaOverrideIssueBody,
  buildSchemaOverrideIssueUrl,
} from './buildSchemaOverrideIssueUrl'

const sampleInheritance = {
  fields: {
    parentId: 'man_made/crane',
    missedFieldIds: ['crane/type'],
    explicitPresetRefs: [] as string[],
  },
}

describe('buildSchemaOverrideIssueUrl', () => {
  it('builds a GitHub new-issue URL with template, title, labels, and body', () => {
    const url = buildSchemaOverrideIssueUrl({
      kind: 'missing-inheritance',
      presetId: 'man_made/crane/untyped_crane',
      snapshotYaml: '  man_made/crane/untyped_crane:\n    fields:\n      parentId: man_made/crane',
      pageUrl: 'https://example.com/preset/man_made/crane/untyped_crane',
      dataUrl: 'https://cdn.example.com/dist/',
    })

    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe(
      'https://github.com/osmberlin/tagging-schema-browser/issues/new',
    )
    expect(parsed.searchParams.get('template')).toBe('missing-inheritance-override.md')
    expect(parsed.searchParams.get('title')).toBe(
      'Overrides: mark man_made/crane/untyped_crane missing inheritance as intentional',
    )
    expect(parsed.searchParams.get('labels')).toBe('cursor-override,missing-inheritance-override')
    const body = parsed.searchParams.get('body') ?? ''
    expect(body).toContain('man_made/crane/untyped_crane')
    expect(body).toContain('.agents/skills/apply-schema-override/SKILL.md')
    expect(body).toContain('schema-override')
    expect(body).toContain('```yaml')
  })

  it('includes stale override section when provided', () => {
    const body = buildSchemaOverrideIssueBody({
      kind: 'missing-inheritance',
      presetId: 'man_made/silo',
      snapshotYaml: '  man_made/silo:\n    fields:\n      parentId: man_made',
      pageUrl: 'https://example.com/preset/man_made/silo',
      dataUrl: '/test-schema',
      existingOverrideYaml: '  man_made/silo:\n    fields:\n      parentId: old',
    })

    expect(body).toContain('## Existing override (stale)')
    expect(body).toContain('parentId: old')
  })

  it('builds missing-inheritance URL from live detection', () => {
    const url = buildMissingInheritanceOverrideIssueUrl({
      presetId: 'man_made/crane/untyped_crane',
      missingFieldInheritance: sampleInheritance,
      pageUrl: 'https://example.com/preset/x',
      dataUrl: '/test-schema',
    })

    const body = new URL(url).searchParams.get('body') ?? ''
    expect(body).toContain('parentId: man_made/crane')
    expect(body).toContain('- crane/type')
  })
})
