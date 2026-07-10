import { describe, expect, it } from 'vitest'
import type { DenormalizedPreset, IconViewModel } from '@/utils/types'
import { flattenIconUsages } from './iconUsageRows'

function preset(id: string, name: string, icon?: string): DenormalizedPreset {
  return {
    id,
    name,
    icon,
    geometry: ['point'],
    tags: {},
    fields: [],
    moreFields: [],
    terms: [],
    aliases: [],
    categoryNames: [],
  }
}

function iconView(name: string, overrides: Partial<IconViewModel> = {}): IconViewModel {
  const presets = overrides.presets ?? []
  const optionUsages = overrides.optionUsages ?? []
  return {
    name,
    prefix: 'maki',
    presetUsageCount: presets.length,
    optionUsageCount: optionUsages.length,
    usageCount: presets.length + optionUsages.length,
    presets,
    optionUsages,
    ...overrides,
  }
}

describe('flattenIconUsages', () => {
  it('emits one row per preset and field option reference', () => {
    const icons = [
      iconView('roentgen-bump', {
        presets: [preset('highway/traffic_calming', 'Traffic calming', 'roentgen-bump')],
        optionUsages: [
          { fieldId: 'traffic_calming', fieldKey: 'traffic_calming', optionValue: 'bump' },
        ],
      }),
    ]

    const rows = flattenIconUsages(
      icons,
      { traffic_calming: { key: 'traffic_calming', type: 'typeCombo' } },
      {},
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      iconName: 'roentgen-bump',
      kind: 'preset',
      label: 'Traffic calming',
      code: 'highway/traffic_calming',
      presetId: 'highway/traffic_calming',
    })
    expect(rows[1]).toMatchObject({
      iconName: 'roentgen-bump',
      kind: 'option',
      code: 'traffic_calming=bump',
      fieldId: 'traffic_calming',
    })
  })

  it('preserves icon order from the filtered list', () => {
    const icons = [
      iconView('maki-cafe', {
        presets: [preset('amenity/cafe', 'Cafe', 'maki-cafe')],
      }),
      iconView('maki-bar', {
        presets: [preset('amenity/bar', 'Bar', 'maki-bar')],
      }),
    ]

    const rows = flattenIconUsages(icons, {}, {})
    expect(rows.map((row) => row.iconName)).toEqual(['maki-cafe', 'maki-bar'])
  })
})
