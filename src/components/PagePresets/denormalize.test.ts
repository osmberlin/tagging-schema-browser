import { describe, expect, it } from 'vitest'
import { denormalize } from '@/components/PagePresets/denormalize'

describe('denormalize', () => {
  it('resolves preset name from English translations', () => {
    const presets = {
      'amenity/cafe': { tags: { amenity: 'cafe' }, geometry: ['point'], fields: [] },
    }
    const translations = {
      en: {
        presets: {
          presets: { 'amenity/cafe': { name: 'Café' } },
          categories: {},
          fields: {},
        },
      },
    }

    const result = denormalize(presets, translations, {}, {})

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Café')
    expect(result[0]?.id).toBe('amenity/cafe')
  })

  it('parses v7 array terms from English translations', () => {
    const presets = {
      'amenity/cafe': { tags: { amenity: 'cafe' }, geometry: ['point'], fields: [] },
    }
    const translations = {
      en: {
        presets: {
          presets: {
            'amenity/cafe': {
              name: 'Café',
              terms: ['coffee', 'espresso'],
              aliases: ['Coffee Shop'],
            },
          },
          categories: {},
          fields: {},
        },
      },
    }

    const result = denormalize(presets, translations, {}, {})

    expect(result[0]?.terms).toEqual(['coffee', 'espresso'])
    expect(result[0]?.aliases).toEqual(['Coffee Shop'])
  })

  it('inherits only the matching field list from nested preset refs', () => {
    const presets = {
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

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      {},
    )

    const child = result.find((p) => p.id === 'preset/child')
    expect(child?.fields).toEqual(['name'])
    expect(child?.moreFields).toEqual([])
  })

  it('does not pull primary fields when a moreFields preset ref has no moreFields', () => {
    const presets = {
      amenity: {
        tags: { amenity: '*' },
        geometry: ['point', 'area'],
        fields: ['amenity'],
      },
      'amenity/bus_station': {
        tags: { amenity: 'bus_station' },
        geometry: ['point', 'area'],
        fields: ['name'],
        moreFields: ['{amenity}'],
      },
    }
    const fields = {
      amenity: { key: 'amenity', type: 'combo' },
      name: { key: 'name', type: 'text' },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      fields,
    )

    const busStation = result.find((p) => p.id === 'amenity/bus_station')
    expect(busStation?.fields).toEqual(['name'])
    expect(busStation?.moreFields).toEqual([])
  })

  it('inherits moreFields only from the referenced preset moreFields list', () => {
    const presets = {
      'amenity/clinic': {
        tags: { amenity: 'clinic' },
        geometry: ['point'],
        fields: ['name', 'operator'],
        moreFields: ['wheelchair'],
      },
      'amenity/clinic/abortion': {
        tags: { amenity: 'clinic', 'healthcare:speciality': 'abortion' },
        geometry: ['point'],
        fields: ['{amenity/clinic}'],
        moreFields: ['{amenity/clinic}'],
      },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      {},
    )

    const abortion = result.find((p) => p.id === 'amenity/clinic/abortion')
    expect(abortion?.fields).toEqual(['name', 'operator'])
    expect(abortion?.moreFields).toEqual(['wheelchair'])
  })

  it('omits inherited typeCombo when the preset already fixes that tag (landuse/grass)', () => {
    const presets = {
      landuse: {
        tags: { landuse: '*' },
        geometry: ['area'],
        fields: ['name', 'landuse'],
      },
      'landuse/grass': {
        tags: { landuse: 'grass' },
        geometry: ['area'],
        fields: ['{landuse}'],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      landuse: { key: 'landuse', type: 'typeCombo' },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      fields,
    )

    const grass = result.find((p) => p.id === 'landuse/grass')
    expect(grass?.fields).toEqual(['name'])
    expect(grass?.fields).not.toContain('landuse')
  })

  it('keeps a directly listed field even when the preset tag is already fixed', () => {
    const presets = {
      landuse: {
        tags: { landuse: '*' },
        geometry: ['area'],
        fields: ['name', 'landuse'],
      },
      'landuse/grass': {
        tags: { landuse: 'grass' },
        geometry: ['area'],
        fields: ['{landuse}', 'landuse'],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      landuse: { key: 'landuse', type: 'typeCombo' },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      fields,
    )

    const grass = result.find((p) => p.id === 'landuse/grass')
    expect(grass?.fields).toEqual(['name', 'landuse'])
  })

  it('flags missing slash-parent field inheritance on explicit child lists', () => {
    const presets = {
      'tourism/information': {
        tags: { tourism: 'information' },
        geometry: ['point'],
        fields: ['information', 'operator', 'address', 'building_area_yes'],
        moreFields: ['level'],
      },
      'tourism/information/terminal': {
        tags: { tourism: 'information', information: 'terminal' },
        geometry: ['point'],
        fields: ['operator'],
        moreFields: ['{tourism/information}'],
      },
      'man_made/crane': {
        tags: { man_made: 'crane' },
        geometry: ['point'],
        fields: ['name', 'crane/type'],
      },
      'man_made/crane/gantry_crane': {
        tags: { man_made: 'crane', 'crane:type': 'gantry_crane' },
        geometry: ['point'],
        fields: ['name'],
      },
    }
    const fields = {
      information: { key: 'information', type: 'combo' },
      operator: { key: 'operator', type: 'text' },
      address: { key: 'addr:full', type: 'text' },
      building_area_yes: { key: 'building', type: 'check' },
      level: { key: 'level', type: 'text' },
      name: { key: 'name', type: 'text' },
      'crane/type': { key: 'crane:type', type: 'combo' },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      fields,
    )

    const terminal = result.find((p) => p.id === 'tourism/information/terminal')
    const gantry = result.find((p) => p.id === 'man_made/crane/gantry_crane')
    expect(terminal?.missingInheritanceStatus).toBe('intentional')
    expect(terminal?.missingFieldInheritance?.fields?.missedFieldIds).toEqual([
      'information',
      'address',
      'building_area_yes',
    ])
    expect(gantry?.missingInheritanceStatus).toBe('unreviewed')
  })
})
