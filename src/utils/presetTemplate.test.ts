import { describe, expect, it } from 'vitest'
import { isTemplatePreset, isTemplatePresetId, isTemplatePresetTags } from './presetTemplate'

describe('isTemplatePresetId', () => {
  it('matches @templates folder paths', () => {
    expect(isTemplatePresetId('@templates/poi')).toBe(true)
    expect(isTemplatePresetId('@templates/crossing/defaults')).toBe(true)
  })

  it('rejects normal preset ids', () => {
    expect(isTemplatePresetId('amenity/cafe')).toBe(false)
    expect(isTemplatePresetId('highway/crossing')).toBe(false)
  })
})

describe('isTemplatePresetTags', () => {
  it('matches the @template tag key', () => {
    expect(isTemplatePresetTags({ '@template': 'poi' })).toBe(true)
  })

  it('does not match unrelated tag values', () => {
    expect(isTemplatePresetTags({ amenity: 'cafe' })).toBe(false)
    expect(isTemplatePresetTags({ highway: 'crossing' })).toBe(false)
  })
})

describe('isTemplatePreset', () => {
  it('matches by id or tags', () => {
    expect(isTemplatePreset({ id: '@templates/poi', tags: {} })).toBe(true)
    expect(isTemplatePreset({ id: 'custom', tags: { '@template': 'poi' } })).toBe(true)
    expect(isTemplatePreset({ id: 'amenity/cafe', tags: { amenity: 'cafe' } })).toBe(false)
  })
})
