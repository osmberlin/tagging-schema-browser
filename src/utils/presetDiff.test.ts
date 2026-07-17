import { describe, expect, it } from 'vitest'
import { comparePresets, diffPreset, isLikelyStaleBranchComparison } from './presetDiff'
import { compareFields } from './schemaDiff'
import type { DenormalizedPreset, SchemaData } from './types'

function preset(id: string, overrides: Partial<DenormalizedPreset> = {}): DenormalizedPreset {
  return {
    id,
    name: id,
    tags: {},
    tagString: '',
    geometry: [],
    fields: [],
    moreFields: [],
    terms: [],
    aliases: [],
    categoryIds: [],
    categoryNames: [],
    matchScore: 1,
    hasIcon: false,
    iconMismatch: false,
    missingFieldInheritance: null,
    missingInheritanceStatus: 'none',
    riskyTypeCombo: null,
    riskyTypeComboStatus: 'none',
    isTemplate: false,
    ...overrides,
  }
}

function minimalSchema(overrides: Partial<SchemaData> = {}): SchemaData {
  return {
    presets: [],
    presetsById: new Map(),
    indices: {
      childPresetIndex: new Map(),
      presetsByPrimaryField: new Map(),
      presetsByMoreField: new Map(),
      fieldOptionMismatchRows: new Map(),
      parentIconMismatchRowsByPresetId: new Map(),
      childIconMismatchRefsByPresetId: new Map(),
      presetsByCategoryId: new Map(),
      presetsByIcon: new Map(),
      optionIconUsagesByIcon: new Map(),
      fieldCatalog: [],
      fieldTypes: [],
      fieldRiskyPresetUsages: new Map(),
    },
    rawPresets: {},
    categories: {},
    categoryNames: {},
    fields: {},
    translations: { en: { presets: { presets: {}, categories: {}, fields: {} } } },
    fieldTranslations: {},
    schemaBuild: { major: 7, versionSpec: null, detection: 'content' },
    loadError: null,
    diagnostics: [],
    ...overrides,
  }
}

describe('diffPreset', () => {
  it('detects name changes', () => {
    const diffs = diffPreset(preset('a', { name: 'Old' }), preset('a', { name: 'New' }))
    expect(diffs).toEqual([{ label: 'Name', kind: 'scalar', before: 'Old', after: 'New' }])
  })

  it('returns empty when presets match', () => {
    expect(diffPreset(preset('a'), preset('a'))).toEqual([])
  })

  it('lists only added and removed fields with order-aware diff', () => {
    const shared = ['brand', 'opening_hours', 'phone', 'website']
    const diffs = diffPreset(
      preset('shop', { fields: ['fhrs/id-GB', ...shared] }),
      preset('shop', { fields: ['address', ...shared] }),
    )

    expect(diffs).toEqual([
      {
        label: 'Fields',
        kind: 'ordered-list',
        before: 'fhrs/id-GB, brand, opening_hours, phone, website',
        after: 'address, brand, opening_hours, phone, website',
        orderedListChanges: {
          removed: ['fhrs/id-GB'],
          added: ['address'],
          moved: [],
          unchangedCount: 4,
        },
      },
    ])
  })

  it('detects unordered list changes for terms', () => {
    const diffs = diffPreset(
      preset('a', { terms: ['alpha', 'beta'] }),
      preset('a', { terms: ['alpha', 'gamma'] }),
    )

    expect(diffs).toEqual([
      {
        label: 'Terms',
        kind: 'unordered-list',
        before: 'alpha, beta',
        after: 'alpha, gamma',
        listChanges: {
          removed: ['beta'],
          added: ['gamma'],
          unchangedCount: 1,
        },
      },
    ])
  })
})

describe('comparePresets', () => {
  it('classifies added, removed, and modified presets', () => {
    const release = [preset('keep'), preset('removed'), preset('mod', { name: 'Before' })]
    const current = [preset('keep'), preset('added'), preset('mod', { name: 'After' })]

    const result = comparePresets(release, current)

    expect(result.added.map((p) => p.id)).toEqual(['added'])
    expect(result.removed.map((p) => p.id)).toEqual(['removed'])
    expect(result.modified.map((m) => m.current.id)).toEqual(['mod'])
    expect(result.statusById.get('keep')).toBe('unchanged')
  })
})

describe('compareFields', () => {
  it('detects added field options', () => {
    const baseline = minimalSchema({
      fields: {
        surface: { key: 'surface', type: 'combo', options: ['clay', 'gravel'] },
      },
      fieldTranslations: {
        surface: { label: 'Surface' },
      },
    })
    const current = minimalSchema({
      fields: {
        surface: { key: 'surface', type: 'combo', options: ['clay', 'gravel', 'laterite'] },
      },
      fieldTranslations: {
        surface: { label: 'Surface' },
      },
    })

    const result = compareFields(baseline, current)

    expect(result.modified).toHaveLength(1)
    expect(result.modified[0]?.current.id).toBe('surface')
    expect(result.modified[0]?.diffs).toEqual([
      {
        label: 'Options',
        kind: 'ordered-list',
        before: 'clay, gravel',
        after: 'clay, gravel, laterite',
        orderedListChanges: {
          removed: [],
          added: ['laterite'],
          moved: [],
          unchangedCount: 2,
        },
      },
    ])
  })
})

describe('isLikelyStaleBranchComparison', () => {
  it('flags many removals with few intentional PR changes', () => {
    const release = Array.from({ length: 40 }, (_, i) => preset(`r${i}`))
    const current = [preset('added'), preset('mod', { name: 'After' }), preset('r0')]
    const result = comparePresets(release, current)
    expect(isLikelyStaleBranchComparison(result)).toBe(true)
  })

  it('ignores balanced diffs', () => {
    const release = [preset('a'), preset('b'), preset('c')]
    const current = [preset('a'), preset('d'), preset('e')]
    const result = comparePresets(release, current)
    expect(isLikelyStaleBranchComparison(result)).toBe(false)
  })
})
