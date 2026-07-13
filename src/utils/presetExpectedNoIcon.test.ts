import { describe, expect, it } from 'vitest'
import { isExpectedNoIconPreset } from './presetExpectedNoIcon'

describe('isExpectedNoIconPreset', () => {
  it('matches generic geometry presets', () => {
    expect(isExpectedNoIconPreset({ id: 'line' })).toBe(true)
    expect(isExpectedNoIconPreset({ id: 'point' })).toBe(true)
    expect(isExpectedNoIconPreset({ id: 'area' })).toBe(true)
  })

  it('matches address-related presets', () => {
    expect(isExpectedNoIconPreset({ id: 'addr/interpolation' })).toBe(true)
    expect(isExpectedNoIconPreset({ id: 'address' })).toBe(true)
  })

  it('rejects normal presets', () => {
    expect(isExpectedNoIconPreset({ id: 'amenity/cafe' })).toBe(false)
    expect(isExpectedNoIconPreset({ id: 'highway/crossing' })).toBe(false)
  })
})
