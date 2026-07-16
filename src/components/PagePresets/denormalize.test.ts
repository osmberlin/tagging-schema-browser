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

  it('flags template presets from @templates paths and @template tags', () => {
    const presets = {
      '@templates/poi': {
        tags: { '@template': 'poi' },
        geometry: ['point'],
        fields: [],
        searchable: false,
      },
      'amenity/cafe': { tags: { amenity: 'cafe' }, geometry: ['point'], fields: [] },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      {},
    )

    expect(result.find((p) => p.id === '@templates/poi')?.isTemplate).toBe(true)
    expect(result.find((p) => p.id === 'amenity/cafe')?.isTemplate).toBe(false)
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

  it('omits inherited typeCombo when slash-parent fields are omitted (highway/mini_roundabout)', () => {
    const presets = {
      highway: {
        tags: { highway: '*' },
        geometry: ['line', 'vertex'],
        fields: ['name', 'highway'],
      },
      'highway/mini_roundabout': {
        tags: { highway: 'mini_roundabout' },
        geometry: ['vertex'],
        moreFields: ['direction_clock'],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      highway: { key: 'highway', type: 'typeCombo' },
      direction_clock: { key: 'direction', type: 'combo' },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      fields,
    )

    const miniRoundabout = result.find((p) => p.id === 'highway/mini_roundabout')
    expect(miniRoundabout?.fields).toEqual(['name'])
    expect(miniRoundabout?.fields).not.toContain('highway')
    expect(miniRoundabout?.moreFields).toEqual(['direction_clock'])
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

  it('omits inherited shop typeCombo from v7 dist expansion (shop/agrarian)', () => {
    const presets = {
      shop: {
        tags: { shop: '*' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'shop',
          'operator',
          'address',
          'building_area_yes',
          'opening_hours',
          'payment_multi',
          'phone',
        ],
      },
      'shop/agrarian': {
        tags: { shop: 'agrarian' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'shop',
          'operator',
          'address',
          'building_area_yes',
          'opening_hours',
          'payment_multi',
          'phone',
          'agrarian',
        ],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      shop: { key: 'shop', type: 'typeCombo' },
      operator: { key: 'operator', type: 'text' },
      address: { key: 'addr:full', type: 'text' },
      building_area_yes: { key: 'building', type: 'check' },
      opening_hours: { key: 'opening_hours', type: 'text' },
      payment_multi: { key: 'payment', type: 'multiCombo' },
      phone: { key: 'phone', type: 'tel' },
      agrarian: { key: 'agrarian', type: 'combo' },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      fields,
    )

    const agrarian = result.find((p) => p.id === 'shop/agrarian')
    expect(agrarian?.fields).toContain('agrarian')
    expect(agrarian?.fields).not.toContain('shop')
  })

  it('omits inherited shop typeCombo from v7 dist moreFields expansion', () => {
    const presets = {
      shop: {
        tags: { shop: '*' },
        geometry: ['point', 'area'],
        fields: ['name', 'shop'],
        moreFields: ['shop', 'operator', 'wheelchair'],
      },
      'shop/boutique': {
        tags: { shop: 'boutique' },
        geometry: ['point', 'area'],
        fields: ['name', 'operator'],
        moreFields: ['shop', 'operator', 'wheelchair', 'boutique'],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      shop: { key: 'shop', type: 'typeCombo' },
      operator: { key: 'operator', type: 'text' },
      wheelchair: { key: 'wheelchair', type: 'combo' },
      boutique: { key: 'boutique', type: 'combo' },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      fields,
    )

    const boutique = result.find((p) => p.id === 'shop/boutique')
    expect(boutique?.moreFields).toContain('boutique')
    expect(boutique?.moreFields).not.toContain('shop')
  })

  it('keeps explicit typeCombo overrides in v7 dist output (highway/road)', () => {
    const presets = {
      'highway/residential': {
        tags: { highway: 'residential' },
        geometry: ['line'],
        fields: ['name', 'oneway', 'maxspeed', 'lanes', 'surface', 'structure'],
      },
      'highway/road': {
        tags: { highway: 'road' },
        geometry: ['line'],
        fields: ['highway', 'name', 'oneway', 'maxspeed', 'lanes', 'surface', 'structure'],
      },
    }
    const fields = {
      highway: { key: 'highway', type: 'typeCombo' },
      name: { key: 'name', type: 'text' },
      oneway: { key: 'oneway', type: 'combo' },
      maxspeed: { key: 'maxspeed', type: 'roadspeed' },
      lanes: { key: 'lanes', type: 'lanes' },
      surface: { key: 'surface', type: 'combo' },
      structure: { key: 'structure', type: 'combo' },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      fields,
    )

    const road = result.find((p) => p.id === 'highway/road')
    expect(road?.fields?.[0]).toBe('highway')
  })

  it('keeps shop typeCombo for shop=yes presets with explicit shop in v7 dist', () => {
    const presets = {
      shop: {
        tags: { shop: '*' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'shop',
          'operator',
          'address',
          'building_area_yes',
          'opening_hours',
          'payment_multi',
          'phone',
        ],
      },
      'shop/yes': {
        tags: { shop: 'yes' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'shop',
          'name',
          'shop',
          'operator',
          'address',
          'building_area_yes',
          'opening_hours',
          'payment_multi',
          'phone',
        ],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      shop: { key: 'shop', type: 'typeCombo' },
      operator: { key: 'operator', type: 'text' },
      address: { key: 'addr:full', type: 'text' },
      building_area_yes: { key: 'building', type: 'check' },
      opening_hours: { key: 'opening_hours', type: 'text' },
      payment_multi: { key: 'payment', type: 'multiCombo' },
      phone: { key: 'phone', type: 'tel' },
    }

    const result = denormalize(
      presets,
      { en: { presets: { presets: {}, categories: {}, fields: {} } } },
      {},
      fields,
    )

    const shopYes = result.find((p) => p.id === 'shop/yes')
    expect(shopYes?.fields).toContain('shop')
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
      'man_made/crane/untyped_crane': {
        tags: { man_made: 'crane' },
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
    const untyped = result.find((p) => p.id === 'man_made/crane/untyped_crane')
    expect(terminal?.missingInheritanceStatus).toBe('intentional')
    expect(terminal?.missingFieldInheritance?.fields?.missedFieldIds).toEqual([
      'address',
      'building_area_yes',
    ])
    expect(untyped?.missingInheritanceStatus).toBe('unreviewed')
  })
})
