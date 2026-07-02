import { describe, expect, it } from 'vitest'
import { simulatePresetTagSwitch } from '@/utils/presetTagSwitch'
import {
  getAssumedTagsForField,
  getFieldTagKeys,
  resolvePresetFieldIds,
} from '@/utils/resolvePresetFieldIds'
import type { RawFields, RawPreset, RawPresets } from '@/utils/types'

describe('getAssumedTagsForField', () => {
  it('uses value tags for semiCombo fields like cuisine', () => {
    const tags = getAssumedTagsForField('cuisine', {
      key: 'cuisine',
      type: 'semiCombo',
      options: ['pizza', 'ramen'],
    })

    expect(tags).toEqual({ cuisine: 'pizza' })
    expect(tags).not.toHaveProperty('cuisine:ramen')
  })

  it('uses prefix tags for multiCombo fields with trailing colon keys', () => {
    const tags = getAssumedTagsForField('diet_multi', {
      key: 'diet:',
      type: 'multiCombo',
      options: ['vegetarian', 'gluten_free'],
    })

    expect(tags).toEqual({
      'diet:vegetarian': 'yes',
      'diet:gluten_free': 'yes',
    })
    expect(Object.keys(tags)).not.toContain('diet::gluten_free')
  })
})

describe('getFieldTagKeys', () => {
  it('matches semiCombo value tags', () => {
    const keys = getFieldTagKeys(
      'cuisine',
      { key: 'cuisine', type: 'semiCombo', options: ['pizza', 'ramen'] },
      { cuisine: 'ramen', 'cuisine:ramen': 'yes' },
    )

    expect(keys).toEqual(['cuisine'])
  })

  it('matches multiCombo prefix tags with trailing colon keys', () => {
    const keys = getFieldTagKeys(
      'diet_multi',
      { key: 'diet:', type: 'multiCombo', options: ['gluten_free'] },
      { 'diet:gluten_free': 'yes' },
    )

    expect(keys).toEqual(['diet:gluten_free'])
  })
})

describe('resolvePresetFieldIds', () => {
  const fields: RawFields = {
    name: { key: 'name', type: 'text' },
    operator: { key: 'operator', type: 'text' },
    cuisine: { key: 'cuisine', type: 'semiCombo', options: ['pizza'] },
  }

  const rawPresets: RawPresets = {
    'preset/base': {
      tags: { shop: 'yes' },
      geometry: ['point'],
      fields: ['name'],
      moreFields: ['operator'],
    },
    'preset/child': {
      tags: { shop: 'convenience' },
      geometry: ['point'],
      fields: ['{preset/base}'],
    },
  }

  it('inherits only the matching field list from nested presets', () => {
    const preset = rawPresets['preset/child'] as RawPreset
    const ids = resolvePresetFieldIds('preset/child', preset, rawPresets, fields)

    expect(ids).toEqual(['name'])
  })
})

describe('simulatePresetTagSwitch restaurant to bank', () => {
  const fields: RawFields = {
    cuisine: { key: 'cuisine', type: 'semiCombo', options: ['pizza', 'ramen'] },
    diet_multi: {
      key: 'diet:',
      type: 'multiCombo',
      options: ['vegetarian', 'vegan', 'halal', 'gluten_free'],
    },
    name: { key: 'name', type: 'text' },
    operator: { key: 'operator', type: 'text' },
    address: { key: 'addr:full', type: 'text' },
    building_area_yes: { key: 'building', type: 'combo', options: ['yes'] },
    opening_hours: { key: 'opening_hours', type: 'text' },
    atm: { key: 'atm', type: 'check' },
  }

  const rawPresets: RawPresets = {
    'amenity/restaurant': {
      tags: { amenity: 'restaurant' },
      geometry: ['point', 'area'],
      fields: ['name', 'cuisine', 'diet_multi', 'address', 'building_area_yes', 'opening_hours'],
    },
    'amenity/bank': {
      tags: { amenity: 'bank' },
      geometry: ['point', 'area'],
      fields: ['name', 'operator', 'address', 'building_area_yes', 'opening_hours', 'atm'],
    },
  }

  it('does not produce double-colon diet tags', () => {
    const result = simulatePresetTagSwitch('amenity/restaurant', 'amenity/bank', rawPresets, fields)

    expect(result).not.toBeNull()

    const doubleColonKeys = result!.rows
      .filter((row) => row.key.includes('::'))
      .map((row) => row.key)
    expect(doubleColonKeys).toEqual([])
    expect(result!.rows.some((row) => row.key === 'diet:gluten_free')).toBe(true)
    expect(result!.rows.some((row) => row.key === 'cuisine')).toBe(true)
    expect(result!.rows.some((row) => row.key.startsWith('cuisine:'))).toBe(false)
  })
})

describe('simulatePresetTagSwitch row order', () => {
  const fields: RawFields = {
    highway: { key: 'highway', type: 'combo', options: ['track', 'unclassified'] },
    surface: { key: 'surface', type: 'combo', options: ['gravel', 'asphalt'] },
  }

  const rawPresets: RawPresets = {
    'highway/track': {
      tags: { highway: 'track' },
      geometry: ['line'],
      fields: ['highway', 'surface'],
    },
    'highway/unclassified': {
      tags: { highway: 'unclassified' },
      geometry: ['line'],
      fields: ['highway'],
    },
  }

  it('lists changed tags before unchanged tags, each group A-Z', () => {
    const result = simulatePresetTagSwitch(
      'highway/track',
      'highway/unclassified',
      rawPresets,
      fields,
    )

    expect(result).not.toBeNull()
    const actions = result!.rows.map((row) => row.action)
    const firstUnchanged = actions.indexOf('unchanged')
    if (firstUnchanged >= 0) {
      expect(actions.slice(0, firstUnchanged).every((action) => action !== 'unchanged')).toBe(true)
      expect(actions.slice(firstUnchanged).every((action) => action === 'unchanged')).toBe(true)
    }

    const changedKeys = result!.rows
      .filter((row) => row.action !== 'unchanged')
      .map((row) => row.key)
    const unchangedKeys = result!.rows
      .filter((row) => row.action === 'unchanged')
      .map((row) => row.key)

    expect(changedKeys).toEqual([...changedKeys].sort((a, b) => a.localeCompare(b)))
    expect(unchangedKeys).toEqual([...unchangedKeys].sort((a, b) => a.localeCompare(b)))
  })
})
