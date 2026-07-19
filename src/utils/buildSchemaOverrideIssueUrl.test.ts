import { describe, expect, it } from 'vitest'
import {
  buildSchemaOverrideIssueBody,
  buildSchemaOverrideIssueUrl,
} from './buildSchemaOverrideIssueUrl'

describe('buildSchemaOverrideIssueUrl', () => {
  it('builds a GitHub new-issue URL with title prefix and body', () => {
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
    expect(parsed.searchParams.get('title')).toBe(
      '[missing-inheritance] man_made/crane/untyped_crane — intentional missing inheritance',
    )
    expect(parsed.searchParams.has('template')).toBe(false)
    const body = parsed.searchParams.get('body') ?? ''
    expect(body).toContain('Tagging Schema Browser')
    expect(body).toContain('Cursor override automation')
    expect(body).not.toContain('> **You**')
    expect(body).not.toContain('apply-schema-override/SKILL.md')
    expect(body).toContain('man_made/crane/untyped_crane')
    expect(body).toContain('```yaml')
    expect(url.length).toBeLessThanOrEqual(7500)
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

    expect(body).toContain('## Snapshot')
    expect(body).not.toContain('parentId: old')
  })

  it('builds stale-removal issue body when live detection is gone', () => {
    const body = buildSchemaOverrideIssueBody({
      kind: 'missing-inheritance',
      presetId: 'tourism/information/terminal',
      snapshotYaml: '',
      pageUrl: 'https://example.com/preset/tourism/information/terminal',
      dataUrl: '/test-schema',
      existingOverrideYaml:
        '  tourism/information/terminal:\n    fields:\n      parentId: tourism/information',
      removeStaleOnly: true,
    })

    expect(body).toContain('## Remove stale override')
    expect(body).toContain('Remove stale override')
    expect(body).not.toContain('## Snapshot')
  })
})
