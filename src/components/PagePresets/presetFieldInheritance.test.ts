import { describe, expect, it } from 'vitest'
import { getInheritedFieldItems } from '@/components/PagePresets/presetFieldInheritance'
import type { RawFields, RawPresets } from '@/utils/types'

describe('getInheritedFieldItems', () => {
  it('still inherits typeCombo fields when the preset tag is generic', () => {
    const rawPresets: RawPresets = {
      shop: {
        tags: { shop: '*' },
        geometry: ['point'],
        fields: ['name', 'shop'],
      },
      'shop/convenience': {
        tags: { shop: 'convenience' },
        geometry: ['point'],
        fields: ['{shop}'],
      },
      'shop/yes': {
        tags: { shop: 'yes' },
        geometry: ['point'],
        fields: ['{shop}'],
      },
    }
    const fields: RawFields = {
      name: { key: 'name', type: 'text' },
      shop: { key: 'shop', type: 'typeCombo' },
    }

    expect(
      getInheritedFieldItems(
        'shop/yes',
        rawPresets['shop/yes']!,
        '{shop}',
        'fields',
        ['{shop}'],
        [],
        rawPresets,
        fields,
      ),
    ).toEqual(['name', 'shop'])
  })

  it('resolves nested preset refs using each preset own inheritance context', () => {
    const rawPresets: RawPresets = {
      office: {
        tags: { office: '*' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'office',
          'address',
          'building_area_yes',
          'opening_hours',
          'phone',
          'website',
        ],
      },
      'office/coworking': {
        tags: { office: 'coworking' },
        geometry: ['point', 'area'],
        fields: ['{office}', 'internet_access', 'internet_access/fee'],
      },
      'amenity/coworking_space': {
        tags: { amenity: 'coworking_space' },
        geometry: ['point', 'area'],
        fields: ['{office/coworking}'],
        moreFields: ['{office/coworking}'],
      },
    }
    const fields: RawFields = {
      name: { key: 'name', type: 'text' },
      office: { key: 'office', type: 'typeCombo' },
      address: { key: 'addr:full', type: 'text' },
      building_area_yes: { key: 'building', type: 'check' },
      opening_hours: { key: 'opening_hours', type: 'text' },
      phone: { key: 'phone', type: 'tel' },
      website: { key: 'website', type: 'url' },
      internet_access: { key: 'internet_access', type: 'combo' },
      'internet_access/fee': { key: 'internet_access:fee', type: 'combo' },
    }

    const hostPreset = rawPresets['amenity/coworking_space']!
    const inherited = getInheritedFieldItems(
      'amenity/coworking_space',
      hostPreset,
      '{office/coworking}',
      'fields',
      ['{office/coworking}'],
      ['{office/coworking}'],
      rawPresets,
      fields,
    )

    expect(inherited).toEqual([
      'name',
      'address',
      'building_area_yes',
      'opening_hours',
      'phone',
      'website',
      'internet_access',
      'internet_access/fee',
    ])
    expect(inherited).not.toContain('office')
  })
})
