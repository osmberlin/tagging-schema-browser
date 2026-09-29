import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { AuditEntry } from '@/components/PageAudits/auditEntries'
import {
  applyMissingInheritanceChanges,
  applyRiskyTypeComboChanges,
  collectAuditDecisions,
  formatOverrideChangeBlock,
  parseOverrideChangeBlock,
  serializeMissingInheritanceYaml,
  yamlHeader,
} from '@/components/PageAudits/overrideChanges'

const entry: AuditEntry = {
  kind: 'missing-inheritance',
  entryId: 'tourism/information/terminal:fields',
  presetId: 'tourism/information/terminal',
  presetName: 'Terminal',
  listKey: 'fields',
  parentId: 'tourism/information',
  fields: [
    { fieldId: 'address', state: 'missing' },
    { fieldId: 'operator', state: 'missing' },
    { fieldId: 'old', state: 'stale' },
  ],
  documentedFieldIds: ['name'],
  explicitPresetRefs: [],
}

describe('overrideChanges', () => {
  it('collects per-field decisions into changes and upstream work', () => {
    const { changes, needsWork } = collectAuditDecisions([entry], {
      'tourism/information/terminal:fields::address': 'intentional',
      'tourism/information/terminal:fields::operator': 'needs_work',
      'tourism/information/terminal:fields::old': 'remove',
    })
    expect(changes).toEqual([
      {
        presetId: 'tourism/information/terminal',
        listKey: 'fields',
        parentId: 'tourism/information',
        add: ['address'],
        remove: ['old'],
      },
    ])
    expect(needsWork).toEqual([{ entry, fieldIds: ['operator'] }])
  })

  it('round-trips the change block through an issue body', () => {
    const changeSet = {
      version: 1 as const,
      kind: 'missing-inheritance' as const,
      changes: [
        { presetId: 'a/b', listKey: 'fields' as const, parentId: 'a', add: ['x'], remove: [] },
      ],
    }
    const body = `intro\n<details>\n\n${formatOverrideChangeBlock(changeSet)}\n\n</details>`
    expect(parseOverrideChangeBlock(body)).toEqual(changeSet)
  })

  it('rejects ids that could inject YAML', () => {
    const body = formatOverrideChangeBlock({
      version: 1,
      kind: 'risky-typecombo',
      changes: [{ presetId: 'a: {evil}', add: ['x'], remove: [] }],
    })
    expect(() => parseOverrideChangeBlock(body)).toThrow(/invalid change/)
  })

  it('applies add/remove and drops empty lists and presets', () => {
    const presets = {
      p: { fields: { parentId: 'a', missedFieldIds: ['old', 'keep'] } },
      q: { moreFields: { parentId: 'a', missedFieldIds: ['gone'] } },
    }
    expect(
      applyMissingInheritanceChanges(presets, [
        { presetId: 'p', listKey: 'fields', parentId: 'a', add: ['new'], remove: ['old'] },
        { presetId: 'q', listKey: 'moreFields', parentId: 'a', add: [], remove: ['gone'] },
      ]),
    ).toEqual({ p: { fields: { parentId: 'a', missedFieldIds: ['keep', 'new'] } } })
    expect(applyRiskyTypeComboChanges({}, [{ presetId: 'r', add: ['t'], remove: [] }])).toEqual({
      r: { fieldIds: ['t'] },
    })
  })

  it('serializes the existing override file unchanged', () => {
    const content = readFileSync('src/data/missing-inheritance-overrides.yaml', 'utf8')
    const parsed = Bun.YAML.parse(content) as {
      presets: Parameters<typeof serializeMissingInheritanceYaml>[1]
    }
    expect(serializeMissingInheritanceYaml(yamlHeader(content), parsed.presets)).toBe(content)
  })
})
