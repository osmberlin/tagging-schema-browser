import { describe, expect, it } from 'vitest'
import {
  displayPresetFieldList,
  getInheritedFieldItems,
  getPresetRefFieldInheritanceBreakdown,
} from '@/components/PagePresets/presetFieldInheritance'
import type { RawFields, RawPresets } from '@/utils/types'

describe('displayPresetFieldList', () => {
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
    const displayFields = displayPresetFieldList(
      'traffic_sign/variable_message',
      'fields',
      hostPreset.fields as string[],
      rawPresets,
    )

    expect(
      getPresetRefFieldInheritanceBreakdown(
        hostPreset,
        '{traffic_sign}',
        'fields',
        displayFields,
        [],
        rawPresets,
        fields,
      ),
    ).toEqual([
      {
        applied: false,
        fieldId: 'traffic_sign',
        reason: 'preset tag fixes traffic_sign=variable_message',
      },
      { applied: true, fieldId: 'traffic_sign/direction' },
      {
        applied: false,
        fieldId: 'direction_point',
        reason: 'direction_vertex listed explicitly (same tag key)',
      },
    ])
  })
})
