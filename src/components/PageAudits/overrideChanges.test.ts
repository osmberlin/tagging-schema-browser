import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { AuditEntry } from '@/components/PageAudits/auditEntries'
import {
  applyLabelMismatchChanges,
  applyMissingInheritanceChanges,
  applyRiskyTypeComboChanges,
  collectAuditDecisions,
  collectLabelMismatchDecisions,
  formatOverrideChangeBlock,
  parseOverrideChangeBlock,
  serializeLabelMismatchYaml,
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

  describe('label mismatch', () => {
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
        {
          fieldId: 'old|amenity/restaurant/old',
          state: 'stale',
          labelPair: {
            optionValue: 'old',
            childPresetId: 'amenity/restaurant/old',
            optionLabel: 'Old',
            childPresetName: 'Old Restaurant',
          },
        },
      ],
      documentedFieldIds: [],
      explicitPresetRefs: [],
    }
    const add: [string, string, string, string] = [
      'pizza',
      'amenity/restaurant/pizza',
      'Pizza',
      'Pizza Restaurant',
    ]

    it('collects decisions per field with the labels that were reviewed', () => {
      const { changes, needsWork } = collectLabelMismatchDecisions([labelEntry], {
        'amenity/restaurant:cuisine::pizza|amenity/restaurant/pizza': 'intentional',
        'amenity/restaurant:cuisine::steak_house|amenity/restaurant/steakhouse': 'needs_work',
        'amenity/restaurant:cuisine::old|amenity/restaurant/old': 'remove',
      })
      expect(changes).toEqual([
        { fieldId: 'cuisine', add: [add], remove: [['old', 'amenity/restaurant/old']] },
      ])
      expect(needsWork).toEqual([
        { entry: labelEntry, fieldIds: ['steak_house|amenity/restaurant/steakhouse'] },
      ])
    })

    it('round-trips labels with quotes and apostrophes through the change block', () => {
      const changeSet = {
        version: 1 as const,
        kind: 'label-mismatch' as const,
        changes: [
          {
            fieldId: 'religion',
            add: [['christian', 'a/b', 'Christian', 'Kingdom Hall of "Jehovah\'s" Witnesses']] as [
              string,
              string,
              string,
              string,
            ][],
            remove: [],
          },
        ],
      }
      expect(parseOverrideChangeBlock(formatOverrideChangeBlock(changeSet))).toEqual(changeSet)
    })

    it('rejects multi-line labels and malformed tuples', () => {
      const block = (addItem: unknown) =>
        formatOverrideChangeBlock({
          version: 1,
          kind: 'label-mismatch',
          changes: [{ fieldId: 'cuisine', add: [addItem as never], remove: [] }],
        })
      expect(() =>
        parseOverrideChangeBlock(block(['pizza', 'a/b', 'Pizza\nevil: 1', 'x'])),
      ).toThrow(/invalid change/)
      expect(() => parseOverrideChangeBlock(block(['pizza', 'a: b', 'Pizza', 'x']))).toThrow(
        /invalid change/,
      )
      expect(() => parseOverrideChangeBlock(block(['pizza', 'a/b', 'Pizza']))).toThrow(
        /invalid change/,
      )
    })

    it('applies changes and writes YAML that parses back to the same entries', () => {
      const fields = applyLabelMismatchChanges(
        {
          cuisine: [
            { option: 'pizza', preset: add[1], optionLabel: 'Pizza', presetName: 'Pizzeria' },
            { option: 'old', preset: 'a/old', optionLabel: 'Old', presetName: 'Older' },
          ],
          gone: [{ option: 'x', preset: 'a/x', optionLabel: 'X', presetName: 'Y' }],
        },
        [
          { fieldId: 'cuisine', add: [add], remove: [['old', 'a/old']] },
          { fieldId: 'gone', add: [], remove: [['x', 'a/x']] },
          {
            fieldId: 'second_hand',
            add: [['only', 'shop/x', 'Only', 'Used "X": Store']],
            remove: [],
          },
        ],
      )
      expect(fields).toEqual({
        cuisine: [
          { option: 'pizza', preset: add[1], optionLabel: 'Pizza', presetName: 'Pizza Restaurant' },
        ],
        second_hand: [
          { option: 'only', preset: 'shop/x', optionLabel: 'Only', presetName: 'Used "X": Store' },
        ],
      })

      const header = yamlHeader(readFileSync('src/data/label-mismatch-overrides.yaml', 'utf8'))
      const yaml = serializeLabelMismatchYaml(header, fields)
      expect(yaml.startsWith(header)).toBe(true)
      expect(Bun.YAML.parse(yaml)).toEqual({ version: 1, fields })
      expect(serializeLabelMismatchYaml(header, {})).toBe(`${header}version: 1\nfields: {}\n`)
    })
  })
})
