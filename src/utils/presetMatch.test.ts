import { describe, expect, it } from 'vitest'
import { regionInLocationSet, describeLocationSet } from '@/utils/locationSet'
import { parseOsmTags, serializeOsmTags } from '@/utils/parseOsmTags'
import { matchesPrerequisiteTag } from '@/utils/prerequisiteTag'
import { matchPresetsFromTags } from '@/utils/presetMatch'
import type { RawFields, RawPresets } from '@/utils/types'

describe('parseOsmTags', () => {
  it('parses key=value lines', () => {
    expect(parseOsmTags('amenity=cafe\nname=Foo')).toEqual({
      amenity: 'cafe',
      name: 'Foo',
    })
  })

  it('ignores comments and blank lines', () => {
    expect(parseOsmTags('# comment\n\nshop=supermarket')).toEqual({ shop: 'supermarket' })
  })

  it('round-trips via serializeOsmTags', () => {
    const tags = { b: '2', a: '1' }
    expect(parseOsmTags(serializeOsmTags(tags))).toEqual(tags)
  })
})

describe('locationSet', () => {
  it('treats Planet include as worldwide', () => {
    expect(regionInLocationSet('gb', { include: ['Planet'] })).toBe(true)
    expect(regionInLocationSet('us', { include: ['Planet'], exclude: ['us'] })).toBe(false)
  })

  it('describes regional sets', () => {
    expect(describeLocationSet({ include: ['gb'] })).toBe('GB only')
    expect(describeLocationSet({ include: ['Planet'], exclude: ['US', 'CA'] })).toBe(
      'Everywhere except US, CA',
    )
  })
})

describe('prerequisiteTag', () => {
  it('requires key presence', () => {
    expect(matchesPrerequisiteTag({ key: 'name' }, { amenity: 'cafe' }, 'operator')).toBe(false)
    expect(matchesPrerequisiteTag({ key: 'name' }, { name: 'X' }, 'operator')).toBe(true)
  })

  it('ignores prerequisite when field key already has a value', () => {
    expect(matchesPrerequisiteTag({ key: 'name' }, { operator: 'Acme' }, 'operator')).toBe(true)
  })

  it('supports valueNot', () => {
    expect(
      matchesPrerequisiteTag({ key: 'fee', valueNot: 'no' }, { fee: 'yes' }, 'payment_multi_fee'),
    ).toBe(true)
    expect(
      matchesPrerequisiteTag({ key: 'fee', valueNot: 'no' }, { fee: 'no' }, 'payment_multi_fee'),
    ).toBe(false)
  })
})

const testPresets: RawPresets = {
  'amenity/cafe': {
    geometry: ['point', 'area'],
    tags: { amenity: 'cafe' },
    fields: ['name'],
  },
  'amenity/clinic': {
    geometry: ['point', 'area'],
    tags: { amenity: 'clinic' },
    addTags: { amenity: 'clinic', healthcare: 'clinic' },
    fields: ['name'],
  },
  'test/regional': {
    geometry: ['point'],
    tags: { amenity: 'test_regional' },
    locationSet: { include: ['Planet'], exclude: ['gb'] },
  },
  'test/regional-GB': {
    geometry: ['point'],
    tags: { amenity: 'test_regional' },
    locationSet: { include: ['gb'] },
  },
}

const testFields: RawFields = {
  name: { key: 'name', type: 'text' },
  'test/fee_field': {
    key: 'payment:coins',
    type: 'check',
    prerequisiteTag: { key: 'fee', valueNot: 'no' },
  },
}

describe('matchPresetsFromTags', () => {
  it('picks the most specific matching preset', () => {
    const result = matchPresetsFromTags({
      tags: { amenity: 'cafe', name: 'X' },
      geometry: 'point',
      rawPresets: testPresets,
      fields: testFields,
    })
    expect(result.winner?.presetId).toBe('amenity/cafe')
    expect(result.fallbackUsed).toBe(false)
  })

  it('reports addTags gaps', () => {
    const result = matchPresetsFromTags({
      tags: { amenity: 'clinic' },
      geometry: 'point',
      rawPresets: testPresets,
      fields: testFields,
    })
    expect(result.winner?.presetId).toBe('amenity/clinic')
    expect(result.addTagsGaps).toEqual([
      { key: 'healthcare', expected: 'clinic', actual: undefined },
    ])
  })

  it('picks regional variant when region matches', () => {
    const result = matchPresetsFromTags({
      tags: { amenity: 'test_regional' },
      geometry: 'point',
      region: 'gb',
      rawPresets: testPresets,
      fields: testFields,
    })
    expect(result.winner?.presetId).toBe('test/regional-GB')
  })

  it('falls back to worldwide variant outside regional include', () => {
    const result = matchPresetsFromTags({
      tags: { amenity: 'test_regional' },
      geometry: 'point',
      region: 'de',
      rawPresets: testPresets,
      fields: testFields,
    })
    expect(result.winner?.presetId).toBe('test/regional')
  })
})
