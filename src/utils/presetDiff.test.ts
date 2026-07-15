import { describe, expect, it } from 'vitest'
import {
  comparePresets,
  diffPreset,
  diffSortedLists,
  isLikelyStaleBranchComparison,
} from './presetDiff'
import type { DenormalizedPreset } from './types'

function preset(id: string, overrides: Partial<DenormalizedPreset> = {}): DenormalizedPreset {
  return {
    id,
    name: id,
    tags: {},
    geometry: [],
    fields: [],
    moreFields: [],
    terms: [],
    aliases: [],
    icon: null,
    category: '',
    searchable: id,
    ...overrides,
  }
}

describe('diffPreset', () => {
  it('detects name changes', () => {
    const diffs = diffPreset(preset('a', { name: 'Old' }), preset('a', { name: 'New' }))
    expect(diffs).toEqual([{ label: 'Name', before: 'Old', after: 'New' }])
  })

  it('returns empty when presets match', () => {
    expect(diffPreset(preset('a'), preset('a'))).toEqual([])
  })

  it('lists only added and removed fields, not unchanged ones', () => {
    const shared = ['brand', 'opening_hours', 'phone', 'website']
    const diffs = diffPreset(
      preset('shop', { fields: ['fhrs/id-GB', ...shared] }),
      preset('shop', { fields: ['address', ...shared] }),
    )

    expect(diffs).toEqual([
      {
        label: 'Fields',
        before: 'brand, fhrs/id-GB, opening_hours, phone, website',
        after: 'address, brand, opening_hours, phone, website',
        listChanges: {
          removed: ['fhrs/id-GB'],
          added: ['address'],
          unchangedCount: 4,
        },
      },
    ])
  })

  it('detects list-only additions and removals', () => {
    const diffs = diffPreset(
      preset('a', { terms: ['alpha', 'beta'] }),
      preset('a', { terms: ['alpha', 'gamma'] }),
    )

    expect(diffs).toEqual([
      {
        label: 'Terms',
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

describe('diffSortedLists', () => {
  it('returns null when lists match', () => {
    expect(diffSortedLists(['a', 'b'], ['a', 'b'])).toBeNull()
  })

  it('classifies removed, added, and unchanged items', () => {
    expect(diffSortedLists(['a', 'b', 'c'], ['a', 'c', 'd'])).toEqual({
      removed: ['b'],
      added: ['d'],
      unchangedCount: 2,
    })
  })

  it('detects duplicate count changes', () => {
    expect(diffSortedLists(['brand', 'brand', 'phone'], ['brand', 'phone'])).toEqual({
      removed: ['brand'],
      added: [],
      unchangedCount: 2,
    })
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
    expect(result.statusById.get('added')).toBe('added')
    expect(result.statusById.get('removed')).toBe('removed')
    expect(result.statusById.get('mod')).toBe('modified')
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
