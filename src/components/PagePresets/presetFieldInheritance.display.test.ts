import { describe, expect, it } from 'vitest'
import {
  buildPresetRefFieldExpansion,
  displayPresetFieldList,
  formatFieldInheritanceOmission,
  getInheritedFieldItems,
  getPresetRefFieldInheritanceBreakdown,
} from '@/components/PagePresets/presetFieldInheritance'
import type { RawFields, RawPresets } from '@/utils/types'

describe('displayPresetFieldList', () => {
  it('formats omission reasons with host preset and field list', () => {
    expect(
      formatFieldInheritanceOmission('email', {
        kind: 'explicitField',
        hostPresetId: 'office/coworking',
        fieldListKey: 'moreFields',
        blockingFieldId: 'email',
        tagKey: 'email',
      }),
    ).toBe('email listed explicitly on office/coworking (moreFields)')

    expect(
      formatFieldInheritanceOmission('office', {
        kind: 'presetTag',
        hostPresetId: 'office/coworking',
        tagKey: 'office',
        tagValue: 'coworking',
      }),
    ).toBe('office/coworking tag fixes office=coworking')
  })

  const rawPresets: RawPresets = {
    traffic_sign: {
      tags: { traffic_sign: '*' },
      geometry: ['point', 'vertex'],
      fields: ['traffic_sign', 'traffic_sign/direction', 'direction_point'],
    },
    'traffic_sign/variable_message': {
      tags: { traffic_sign: 'variable_message' },
      geometry: ['point', 'vertex'],
      fields: ['traffic_sign', 'traffic_sign/direction', 'direction_point', 'direction_vertex'],
    },
    'amenity/clinic': {
      tags: { amenity: 'clinic' },
      geometry: ['point', 'area'],
      fields: ['name', 'operator'],
      moreFields: ['wheelchair'],
    },
    'amenity/clinic/abortion': {
      tags: { amenity: 'clinic', 'healthcare:speciality': 'abortion' },
      geometry: ['point', 'area'],
      fields: ['{amenity/clinic}'],
      moreFields: ['{amenity/clinic}'],
    },
  }

  it('collapses dist-expanded slash-parent fields to a preset ref', () => {
    const list = rawPresets['traffic_sign/variable_message']?.fields as string[]
    expect(
      displayPresetFieldList('traffic_sign/variable_message', 'fields', list, rawPresets),
    ).toEqual(['{traffic_sign}', 'direction_vertex'])
  })

  it('keeps lists that already use preset refs', () => {
    const list = rawPresets['amenity/clinic/abortion']?.fields as string[]
    expect(displayPresetFieldList('amenity/clinic/abortion', 'fields', list, rawPresets)).toEqual([
      '{amenity/clinic}',
    ])
  })

  it('leaves unrelated explicit fields unchanged', () => {
    const presets: RawPresets = {
      shop: {
        tags: { shop: '*' },
        geometry: ['point'],
        fields: ['name', 'shop'],
      },
      'shop/pasta': {
        tags: { shop: 'pasta' },
        geometry: ['point'],
        fields: ['name', 'opening_hours'],
      },
    }

    expect(
      displayPresetFieldList('shop/pasta', 'fields', presets['shop/pasta']?.fields, presets),
    ).toEqual(['name', 'opening_hours'])
  })

  it('resolves nested fields from a collapsed preset ref using display field lists', () => {
    const rawPresets: RawPresets = {
      traffic_sign: {
        tags: { traffic_sign: '*' },
        geometry: ['point', 'vertex'],
        fields: ['traffic_sign', 'traffic_sign/direction', 'direction_point'],
      },
      'traffic_sign/variable_message': {
        tags: { traffic_sign: 'variable_message' },
        geometry: ['point', 'vertex'],
        fields: ['traffic_sign', 'traffic_sign/direction', 'direction_point', 'direction_vertex'],
      },
    }
    const fields: RawFields = {
      traffic_sign: { key: 'traffic_sign', type: 'typeCombo' },
      'traffic_sign/direction': { key: 'traffic_sign:direction', type: 'radio' },
      direction_point: { key: 'direction', type: 'number' },
      direction_vertex: { key: 'direction', type: 'radio' },
    }
    const hostPreset = rawPresets['traffic_sign/variable_message']!
    const distFields = hostPreset.fields as string[]
    const displayFields = displayPresetFieldList(
      'traffic_sign/variable_message',
      'fields',
      distFields,
      rawPresets,
    )

    expect(displayFields).toEqual(['{traffic_sign}', 'direction_vertex'])

    const inherited = getInheritedFieldItems(
      'traffic_sign/variable_message',
      hostPreset,
      '{traffic_sign}',
      'fields',
      displayFields,
      [],
      rawPresets,
      fields,
    )

    expect(inherited).toEqual(['traffic_sign/direction'])
  })

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

  it('collapses dist-expanded non-slash preset refs to a preset ref', () => {
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
        moreFields: ['email', 'fax'],
      },
      'office/coworking': {
        tags: { office: 'coworking' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'office',
          'address',
          'building_area_yes',
          'opening_hours',
          'phone',
          'website',
          'internet_access',
          'internet_access/fee',
        ],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website'],
      },
      'amenity/coworking_space': {
        tags: { amenity: 'coworking_space' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'office',
          'address',
          'building_area_yes',
          'opening_hours',
          'phone',
          'website',
          'internet_access',
          'internet_access/fee',
        ],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website'],
        searchable: false,
      },
    }

    expect(
      displayPresetFieldList(
        'amenity/coworking_space',
        'fields',
        rawPresets['amenity/coworking_space']?.fields,
        rawPresets,
      ),
    ).toEqual(['{office/coworking}'])
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

  it('prefers template refs when collapsing dist-expanded moreFields prefixes', () => {
    const rawPresets: RawPresets = {
      '@templates/contact': {
        tags: { '@template': 'contact' },
        geometry: ['point'],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website'],
      },
      'barrier/border_control': {
        tags: { barrier: 'border_control' },
        geometry: ['point'],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website', 'address'],
      },
      'leisure/marina_no_facilities': {
        tags: { 'seamark:harbour:category': 'marina_no_facilities' },
        geometry: ['point', 'area'],
        fields: ['name'],
        moreFields: [
          'email',
          'fax',
          'mobile',
          'phone',
          'website',
          'address',
          'gnis/feature_id-US',
          'seamark/harbour/category_marina',
          'seamark/type',
        ],
      },
    }

    expect(
      displayPresetFieldList(
        'leisure/marina_no_facilities',
        'moreFields',
        rawPresets['leisure/marina_no_facilities']?.moreFields,
        rawPresets,
      ),
    ).toEqual([
      '{@templates/contact}',
      'address',
      'gnis/feature_id-US',
      'seamark/harbour/category_marina',
      'seamark/type',
    ])
  })

  it('does not collapse contact template moreFields onto olive_grove', () => {
    const rawPresets: RawPresets = {
      '@templates/contact': {
        tags: { '@template': 'contact' },
        geometry: ['point'],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website'],
      },
      'landuse/olive_grove': {
        tags: { landuse: 'orchard', trees: 'olive_trees' },
        geometry: ['area'],
        fields: ['name', 'operator'],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website'],
      },
    }

    expect(
      displayPresetFieldList(
        '@templates/contact',
        'moreFields',
        rawPresets['@templates/contact']?.moreFields,
        rawPresets,
      ),
    ).toEqual(['email', 'fax', 'mobile', 'phone', 'website'])
    expect(
      displayPresetFieldList(
        'landuse/olive_grove',
        'moreFields',
        rawPresets['landuse/olive_grove']?.moreFields,
        rawPresets,
      ),
    ).toEqual(['{@templates/contact}'])
  })

  it('collapses office/coworking dist fields to preset and template refs', () => {
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
      '@templates/internet_access': {
        tags: { '@template': 'internet_access' },
        geometry: ['point'],
        fields: ['internet_access', 'internet_access/fee'],
        moreFields: ['internet_access', 'internet_access/fee', 'internet_access/ssid'],
      },
      '@templates/poi': {
        tags: { '@template': 'poi' },
        geometry: ['point'],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website', 'address', 'wheelchair'],
      },
      'office/coworking': {
        tags: { office: 'coworking' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'office',
          'address',
          'building_area_yes',
          'opening_hours',
          'phone',
          'website',
          'internet_access',
          'internet_access/fee',
        ],
        moreFields: [
          'internet_access',
          'internet_access/fee',
          'internet_access/ssid',
          'email',
          'fax',
          'mobile',
          'phone',
          'website',
          'address',
          'wheelchair',
        ],
      },
    }

    expect(
      displayPresetFieldList(
        'office/coworking',
        'fields',
        rawPresets['office/coworking']?.fields,
        rawPresets,
      ),
    ).toEqual(['{office}', '{@templates/internet_access}'])
    expect(
      displayPresetFieldList(
        'office/coworking',
        'moreFields',
        rawPresets['office/coworking']?.moreFields,
        rawPresets,
      ),
    ).toEqual(['{@templates/internet_access}', '{@templates/poi}'])
  })

  it('lists nested preset refs and omitted fields for the referenced preset host', () => {
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
      '@templates/internet_access': {
        tags: { '@template': 'internet_access' },
        geometry: ['point'],
        fields: ['internet_access', 'internet_access/fee'],
      },
      'office/coworking': {
        tags: { office: 'coworking' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'office',
          'address',
          'building_area_yes',
          'opening_hours',
          'phone',
          'website',
          'internet_access',
          'internet_access/fee',
        ],
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
    expect(
      buildPresetRefFieldExpansion('office/coworking', '{office}', 'fields', rawPresets, fields),
    ).toEqual([
      { kind: 'field', fieldId: 'name', applied: true },
      {
        kind: 'field',
        fieldId: 'office',
        applied: false,
        omission: {
          kind: 'presetTag',
          hostPresetId: 'office/coworking',
          tagKey: 'office',
          tagValue: 'coworking',
        },
      },
      { kind: 'field', fieldId: 'address', applied: true },
      { kind: 'field', fieldId: 'building_area_yes', applied: true },
      { kind: 'field', fieldId: 'opening_hours', applied: true },
      { kind: 'field', fieldId: 'phone', applied: true },
      { kind: 'field', fieldId: 'website', applied: true },
    ])
  })

  it('does not use the referenced preset as its own inheritance host', () => {
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
        fields: [
          'name',
          'office',
          'address',
          'building_area_yes',
          'opening_hours',
          'phone',
          'website',
          'internet_access',
        ],
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
    }

    const wrongHostOmitted = buildPresetRefFieldExpansion(
      'office',
      '{office}',
      'fields',
      rawPresets,
      fields,
    ).filter((entry) => entry.kind === 'field' && !entry.applied)

    expect(wrongHostOmitted.length).toBeGreaterThan(1)
    expect(
      wrongHostOmitted.some((entry) => entry.kind === 'field' && entry.fieldId === 'name'),
    ).toBe(true)

    expect(
      buildPresetRefFieldExpansion(
        'office/coworking',
        '{office}',
        'fields',
        rawPresets,
        fields,
      ).filter((entry) => entry.kind === 'field' && !entry.applied),
    ).toEqual([
      {
        kind: 'field',
        fieldId: 'office',
        applied: false,
        omission: {
          kind: 'presetTag',
          hostPresetId: 'office/coworking',
          tagKey: 'office',
          tagValue: 'coworking',
        },
      },
    ])
  })

  it('shows nested preset refs instead of false omitted fields for coworking_space', () => {
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
      '@templates/internet_access': {
        tags: { '@template': 'internet_access' },
        geometry: ['point'],
        fields: ['internet_access', 'internet_access/fee'],
        moreFields: ['internet_access', 'internet_access/fee', 'internet_access/ssid'],
      },
      '@templates/poi': {
        tags: { '@template': 'poi' },
        geometry: ['point'],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website', 'address', 'wheelchair'],
      },
      'office/coworking': {
        tags: { office: 'coworking' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'office',
          'address',
          'building_area_yes',
          'opening_hours',
          'phone',
          'website',
          'internet_access',
          'internet_access/fee',
        ],
        moreFields: [
          'internet_access',
          'internet_access/fee',
          'internet_access/ssid',
          'email',
          'fax',
          'mobile',
          'phone',
          'website',
          'address',
          'wheelchair',
        ],
      },
      'amenity/coworking_space': {
        tags: { amenity: 'coworking_space' },
        geometry: ['point', 'area'],
        fields: [
          'name',
          'office',
          'address',
          'building_area_yes',
          'opening_hours',
          'phone',
          'website',
          'internet_access',
          'internet_access/fee',
        ],
        moreFields: [
          'internet_access',
          'internet_access/fee',
          'internet_access/ssid',
          'email',
          'fax',
          'mobile',
          'phone',
          'website',
          'address',
          'wheelchair',
        ],
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
      'internet_access/ssid': { key: 'internet_access:ssid', type: 'text' },
      email: { key: 'email', type: 'email' },
      fax: { key: 'fax', type: 'text' },
      mobile: { key: 'mobile', type: 'tel' },
      wheelchair: { key: 'wheelchair', type: 'combo' },
    }
    expect(
      buildPresetRefFieldExpansion(
        'office/coworking',
        '{office}',
        'fields',
        rawPresets,
        fields,
      ).filter((entry) => entry.kind === 'field' && !entry.applied),
    ).toEqual([
      {
        kind: 'field',
        fieldId: 'office',
        applied: false,
        omission: {
          kind: 'presetTag',
          hostPresetId: 'office/coworking',
          tagKey: 'office',
          tagValue: 'coworking',
        },
      },
    ])

    expect(
      buildPresetRefFieldExpansion(
        'amenity/coworking_space',
        '{office/coworking}',
        'fields',
        rawPresets,
        fields,
      ),
    ).toEqual([
      {
        kind: 'presetRef',
        presetRef: '{office}',
        presetId: 'office',
        children: [
          { kind: 'field', fieldId: 'name', applied: true },
          {
            kind: 'field',
            fieldId: 'office',
            applied: false,
            omission: {
              kind: 'presetTag',
              hostPresetId: 'office/coworking',
              tagKey: 'office',
              tagValue: 'coworking',
            },
          },
          { kind: 'field', fieldId: 'address', applied: true },
          { kind: 'field', fieldId: 'building_area_yes', applied: true },
          { kind: 'field', fieldId: 'opening_hours', applied: true },
          { kind: 'field', fieldId: 'phone', applied: true },
          { kind: 'field', fieldId: 'website', applied: true },
        ],
      },
      {
        kind: 'presetRef',
        presetRef: '{@templates/internet_access}',
        presetId: '@templates/internet_access',
        children: [
          { kind: 'field', fieldId: 'internet_access', applied: true },
          { kind: 'field', fieldId: 'internet_access/fee', applied: true },
        ],
      },
    ])
  })

  it('marks cyclic preset refs in the expansion tree', () => {
    const rawPresets: RawPresets = {
      'preset/a': {
        tags: { a: 'yes' },
        geometry: ['point'],
        fields: ['{preset/b}'],
      },
      'preset/b': {
        tags: { b: 'yes' },
        geometry: ['point'],
        fields: ['{preset/a}'],
      },
    }

    expect(
      buildPresetRefFieldExpansion('preset/a', '{preset/b}', 'fields', rawPresets, {}),
    ).toEqual([
      {
        kind: 'presetRef',
        presetRef: '{preset/a}',
        presetId: 'preset/a',
        cyclic: true,
        children: [],
      },
    ])
  })

  it('builds marina contact template expansion without cycles', () => {
    const rawPresets: RawPresets = {
      '@templates/contact': {
        tags: { '@template': 'contact' },
        geometry: ['point'],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website'],
      },
      'landuse/olive_grove': {
        tags: { landuse: 'orchard', trees: 'olive_trees' },
        geometry: ['area'],
        fields: ['name', 'operator'],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website'],
      },
      'leisure/marina_no_facilities': {
        tags: { 'seamark:harbour:category': 'marina_no_facilities' },
        geometry: ['point', 'area'],
        fields: ['name'],
        moreFields: ['email', 'fax', 'mobile', 'phone', 'website', 'address', 'gnis/feature_id-US'],
      },
    }
    const fields: RawFields = {
      email: { key: 'email', type: 'email' },
      fax: { key: 'fax', type: 'text' },
      mobile: { key: 'mobile', type: 'tel' },
      phone: { key: 'phone', type: 'tel' },
      website: { key: 'website', type: 'url' },
      address: { key: 'addr:full', type: 'text' },
      'gnis/feature_id-US': { key: 'gnis:feature_id', type: 'text' },
    }

    expect(
      buildPresetRefFieldExpansion(
        'leisure/marina_no_facilities',
        '{@templates/contact}',
        'moreFields',
        rawPresets,
        fields,
      ),
    ).toEqual([
      { kind: 'field', fieldId: 'email', applied: true },
      { kind: 'field', fieldId: 'fax', applied: true },
      { kind: 'field', fieldId: 'mobile', applied: true },
      { kind: 'field', fieldId: 'phone', applied: true },
      { kind: 'field', fieldId: 'website', applied: true },
    ])
  })

  it('explains omitted fields when expanding a preset ref', () => {
    const rawPresets: RawPresets = {
      traffic_sign: {
        tags: { traffic_sign: '*' },
        geometry: ['point', 'vertex'],
        fields: ['traffic_sign', 'traffic_sign/direction', 'direction_point'],
      },
      'traffic_sign/variable_message': {
        tags: { traffic_sign: 'variable_message' },
        geometry: ['point', 'vertex'],
        fields: ['traffic_sign', 'traffic_sign/direction', 'direction_point', 'direction_vertex'],
      },
    }
    const fields: RawFields = {
      traffic_sign: { key: 'traffic_sign', type: 'typeCombo' },
      'traffic_sign/direction': { key: 'traffic_sign:direction', type: 'radio' },
      direction_point: { key: 'direction', type: 'number' },
      direction_vertex: { key: 'direction', type: 'radio' },
    }
    const hostPreset = rawPresets['traffic_sign/variable_message']!

    expect(
      getPresetRefFieldInheritanceBreakdown(
        'traffic_sign/variable_message',
        hostPreset,
        '{traffic_sign}',
        'fields',
        rawPresets,
        fields,
      ),
    ).toEqual([
      {
        applied: false,
        fieldId: 'traffic_sign',
        omission: {
          kind: 'presetTag',
          hostPresetId: 'traffic_sign/variable_message',
          tagKey: 'traffic_sign',
          tagValue: 'variable_message',
        },
        reason: 'traffic_sign/variable_message tag fixes traffic_sign=variable_message',
      },
      { applied: true, fieldId: 'traffic_sign/direction' },
      {
        applied: false,
        fieldId: 'direction_point',
        omission: {
          kind: 'explicitField',
          hostPresetId: 'traffic_sign/variable_message',
          fieldListKey: 'fields',
          blockingFieldId: 'direction_vertex',
          tagKey: 'direction',
        },
        reason:
          'direction_point blocked by direction_vertex on traffic_sign/variable_message (fields, same tag key `direction`)',
      },
    ])
  })
})
