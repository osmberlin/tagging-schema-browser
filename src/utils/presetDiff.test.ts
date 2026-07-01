import { describe, expect, it } from 'vitest'
import { comparePresets, diffPreset } from './presetDiff'
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
