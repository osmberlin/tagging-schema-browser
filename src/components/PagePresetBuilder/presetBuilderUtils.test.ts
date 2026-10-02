import { describe, expect, it } from 'vitest'
import {
  presetIdFromTags,
  presetRepoPath,
  parseStringList,
  stringifyStringList,
  buildRawPreset,
  PRESET_BUILDER_DEFAULTS,
} from '@/components/PagePresetBuilder/presetBuilderUtils'

describe('presetIdFromTags', () => {
  it('derives single-tag preset ids', () => {
    expect(presetIdFromTags({ amenity: 'cafe' })).toBe('amenity/cafe')
    expect(presetIdFromTags({ shop: 'pasta' })).toBe('shop/pasta')
  })

  it('derives multi-tag sub-preset ids', () => {
    expect(presetIdFromTags({ amenity: 'clinic', 'healthcare:speciality': 'abortion' })).toBe(
      'amenity/clinic/abortion',
    )
    expect(presetIdFromTags({ man_made: 'crane', 'crane:type': 'portal_crane' })).toBe(
      'man_made/crane/portal_crane',
    )
  })
})

describe('presetRepoPath searchable convention', () => {
  it('uses underscore filename when searchable is false', () => {
    expect(presetRepoPath('shop/ice_cream', false)).toBe('data/presets/shop/_ice_cream.json')
    expect(presetRepoPath('shop/ice_cream', true)).toBe('data/presets/shop/ice_cream.json')
  })
})

describe('string list URL helpers', () => {
  it('round-trips string arrays', () => {
    const raw = stringifyStringList(['building', '{shop}', 'name'])
    expect(parseStringList(raw)).toEqual(['building', '{shop}', 'name'])
  })
})

describe('buildRawPreset', () => {
  it('never includes imageURL', () => {
    const preset = buildRawPreset({
      ...PRESET_BUILDER_DEFAULTS,
      name: 'Café',
      icon: 'maki-cafe',
      tags: { amenity: 'cafe' },
      geometry: ['point'],
    })
    expect(preset).not.toHaveProperty('imageURL')
    expect(preset.icon).toBe('maki-cafe')
  })
})
