import { describe, expect, it } from 'vitest'
import type { AuditEntry } from '@/components/PageAudits/auditEntries'
import { buildBatchSchemaOverrideIssueUrl } from '@/components/PageAudits/buildBatchOverrideIssueUrl'
import { parseOverrideChangeBlock } from '@/components/PageAudits/overrideChanges'

const entry: AuditEntry = {
  kind: 'risky-typecombo',
  entryId: 'shop/trade',
  presetId: 'shop/trade',
  presetName: 'Trade Shop',
  fields: [
    { fieldId: 'trade', state: 'missing', fieldKey: 'trade' },
    { fieldId: 'other', state: 'missing', fieldKey: 'other' },
  ],
  documentedFieldIds: [],
  explicitPresetRefs: [],
}

function issueParams(
  decisions: Parameters<typeof buildBatchSchemaOverrideIssueUrl>[0]['decisions'],
) {
  const url = buildBatchSchemaOverrideIssueUrl({
    slug: 'risky-typecombo',
    entries: [entry],
    decisions,
    dataUrl: '',
  })
  return new URL(url).searchParams
}

describe('buildBatchSchemaOverrideIssueUrl', () => {
  it('writes a parseable change block and lists upstream work', () => {
    const params = issueParams({
      'shop/trade::trade': 'intentional',
      'shop/trade::other': 'needs_work',
    })
    expect(params.get('title')).toBe('[risky-typecombo] audit review (1 preset)')
    const body = params.get('body')!
    expect(body).toContain('## Fix upstream in id-tagging-schema')
    expect(parseOverrideChangeBlock(body).changes).toEqual([
      { presetId: 'shop/trade', add: ['trade'], remove: [] },
    ])
  })

  it('wraps the schema reference in backticks so GitHub does not auto-link it', () => {
    const body = issueParams({ 'shop/trade::other': 'needs_work' }).get('body')!
    expect(body).toContain('\nSchema: `release`\n')
  })

  it('omits the change block for tracking-only issues', () => {
    expect(issueParams({ 'shop/trade::other': 'needs_work' }).get('body')).not.toContain(
      'override-changes',
    )
  })

  it('throws without decisions', () => {
    expect(() => issueParams({})).toThrow(/Decide at least one field/)
  })
})
