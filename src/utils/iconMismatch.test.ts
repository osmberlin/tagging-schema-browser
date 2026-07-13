import { describe, expect, it } from 'vitest'
import {
  getChildPresetIconMismatchRefs,
  getParentPresetIconMismatchRows,
} from '@/utils/iconMismatch'
import type { DenormalizedPreset, FieldTranslations, RawFields } from '@/utils/types'

const fields: RawFields = {
  'playground/type': {
    key: 'playground',
    type: 'combo',
    icons: { slide: 'temaki-slide2', cushion: 'temaki-cushion' },
    options: ['slide', 'cushion'],
  },
}

const fieldTranslations: FieldTranslations = {
  'playground/type': {
    label: 'Equipment',
    options: { slide: { title: 'Slide' }, cushion: { title: 'Cushion' } },
  },
}

const presets: DenormalizedPreset[] = [
  {
    id: 'leisure/playground',
    name: 'Playground',
    icon: 'maki-playground',
    fields: ['playground/type'],
    moreFields: [],
    tags: { leisure: 'playground' },
    tagString: 'leisure=playground',
    geometry: ['point'],
    categoryIds: [],
    categoryNames: [],
    searchable: true,
    iconMismatch: true,
    isTemplate: false,
  },
  {
    id: 'leisure/playground/slide',
    name: 'Playground Slide',
    icon: 'roentgen-slide',
    fields: [],
    moreFields: [],
    tags: { leisure: 'playground', playground: 'slide' },
    tagString: 'leisure=playground playground=slide',
    geometry: ['point'],
    categoryIds: [],
    categoryNames: [],
    searchable: true,
    iconMismatch: true,
    isTemplate: false,
  },
  {
    id: 'leisure/playground/cushion',
    name: 'Playground Cushion',
    icon: 'maki-playground',
    fields: [],
    moreFields: [],
    tags: { leisure: 'playground', playground: 'cushion' },
    tagString: 'leisure=playground playground=cushion',
    geometry: ['point'],
    categoryIds: [],
    categoryNames: [],
    searchable: true,
    iconMismatch: true,
    isTemplate: false,
  },
]

describe('icon mismatch refs', () => {
  it('finds parent field rows with mismatched child presets', () => {
    const rows = getParentPresetIconMismatchRows(presets[0]!, fields, fieldTranslations, presets)
    expect(rows).toHaveLength(2)
    expect(rows.map((entry) => entry.row.optionValue).sort()).toEqual(['cushion', 'slide'])
  })

  it('finds parent field references when viewing a child preset', () => {
    const refs = getChildPresetIconMismatchRefs(
      'leisure/playground/cushion',
      fields,
      fieldTranslations,
      presets,
    )
    expect(refs).toHaveLength(1)
    expect(refs[0]?.parent.id).toBe('leisure/playground')
    expect(refs[0]?.row.optionValue).toBe('cushion')
    expect(refs[0]?.row.icon).toBe('temaki-cushion')
    expect(refs[0]?.section.fieldId).toBe('playground/type')
  })
})
