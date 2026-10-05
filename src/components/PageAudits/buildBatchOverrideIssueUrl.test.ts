import { describe, expect, it } from 'vitest'
import type { AuditEntry } from '@/components/PageAudits/auditEntries'
import {
  buildBatchSchemaOverrideIssueUrl,
  ISSUE_URL_MAX_LENGTH,
  tryBuildBatchSchemaOverrideIssueUrl,
} from '@/components/PageAudits/buildBatchOverrideIssueUrl'
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

  it('reports an over-long issue via the non-throwing helper', () => {
    const many: AuditEntry[] = Array.from({ length: 400 }, (_, index) => ({
      ...entry,
      entryId: `shop/trade${index}`,
      presetId: `shop/trade${index}`,
    }))
    const decisions = Object.fromEntries(
      many.map((item) => [`${item.entryId}::trade`, 'intentional' as const]),
    )
    const args = { slug: 'risky-typecombo' as const, entries: many, decisions, dataUrl: '' }
    const result = tryBuildBatchSchemaOverrideIssueUrl(args)
    expect(result).toEqual({ error: expect.stringContaining(`> ${ISSUE_URL_MAX_LENGTH}`) })
    expect(
      tryBuildBatchSchemaOverrideIssueUrl({ ...args, entries: many.slice(0, 1) }),
    ).toHaveProperty('url')
  })

  it('builds a label-mismatch issue with the reviewed labels in the change block', () => {
    const labelEntry: AuditEntry = {
      kind: 'label-mismatch',
      entryId: 'amenity/restaurant:cuisine',
      presetId: 'amenity/restaurant',
      presetName: 'Restaurant',
      optionFieldId: 'cuisine',
      fields: [
        {
          fieldId: 'pizza|amenity/restaurant/pizza',
          state: 'missing',
          labelPair: {
            optionValue: 'pizza',
            childPresetId: 'amenity/restaurant/pizza',
            optionLabel: 'Pizza',
            childPresetName: 'Pizza Restaurant',
            kind: 'extends',
          },
        },
        {
          fieldId: 'steak_house|amenity/restaurant/steakhouse',
          state: 'missing',
          labelPair: {
            optionValue: 'steak_house',
            childPresetId: 'amenity/restaurant/steakhouse',
            optionLabel: 'Steak House',
            childPresetName: 'Steakhouse',
            kind: 'differs',
          },
        },
      ],
      documentedFieldIds: [],
      explicitPresetRefs: [],
    }
    const params = new URL(
      buildBatchSchemaOverrideIssueUrl({
        slug: 'label-mismatch',
        entries: [labelEntry],
        decisions: {
          'amenity/restaurant:cuisine::pizza|amenity/restaurant/pizza': 'intentional',
          'amenity/restaurant:cuisine::steak_house|amenity/restaurant/steakhouse': 'needs_work',
        },
        dataUrl: '',
      }),
    ).searchParams
    expect(params.get('title')).toBe('[label-mismatch] audit review (2 options)')
    const body = params.get('body')!
    expect(body).toContain('`cuisine` option `steak_house` “Steak House” ≠ [Steakhouse](')
    expect(parseOverrideChangeBlock(body)).toEqual({
      version: 1,
      kind: 'label-mismatch',
      changes: [
        {
          fieldId: 'cuisine',
          add: [['pizza', 'amenity/restaurant/pizza', 'Pizza', 'Pizza Restaurant']],
          remove: [],
        },
      ],
    })
  })
})
