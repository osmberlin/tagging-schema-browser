import { describe, expect, it } from 'vitest'
import { applyFieldFacets } from '@/components/PageFields/fieldFacetFilter'
import type { FieldViewModel } from '@/utils/types'

describe('applyFieldFacets f_optionIcon', () => {
  it('only includes preset-attached fields with matching option icons', () => {
    const fields: FieldViewModel[] = [
      {
        id: 'used',
        key: 'used',
        type: 'combo',
        label: 'Used',
        geometry: [],
        universal: false,
        usageCount: 2,
        primaryCount: 2,
        moreCount: 0,
        presets: [],
        iconMismatchCount: 0,
        optionIconNames: ['maki-park'],
        riskyUsageCount: 0,
      },
      {
        id: 'unused',
        key: 'unused',
        type: 'combo',
        label: 'Unused',
        geometry: [],
        universal: false,
        usageCount: 0,
        primaryCount: 0,
        moreCount: 0,
        presets: [],
        iconMismatchCount: 0,
        optionIconNames: ['maki-park'],
        riskyUsageCount: 0,
      },
      {
        id: 'other',
        key: 'other',
        type: 'combo',
        label: 'Other',
        geometry: [],
        universal: false,
        usageCount: 1,
        primaryCount: 1,
        moreCount: 0,
        presets: [],
        iconMismatchCount: 0,
        optionIconNames: ['maki-tree'],
        riskyUsageCount: 0,
      },
    ]

    const filtered = applyFieldFacets(fields, {
      f_q: '',
      f_type: 'all',
      f_usage: 'all',
      f_iconMismatch: 'all',
      f_sort: 'name',
      f_optionIcon: 'maki-park',
    })

    expect(filtered.map((field) => field.id)).toEqual(['used'])
  })
})
