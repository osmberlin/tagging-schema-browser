import { describe, expect, it } from 'vitest'
import { getFieldOptionMismatchRows } from '@/utils/fieldOptions'
import {
  buildChildPresetIndex,
  buildFieldPresetIndex,
  buildSchemaIndices,
  childPresetLookupKey,
} from '@/utils/schemaIndices'
import type { DenormalizedPreset } from '@/utils/types'

function stubPreset(
  id: string,
  fields: string[] = [],
  moreFields: string[] = [],
): DenormalizedPreset {
  return {
    id,
    name: id,
    tags: {},
    tagString: '',
    geometry: ['line'],
    fields,
    moreFields,
    categoryIds: [],
    categoryNames: [],
    terms: [],
    aliases: [],
    matchScore: 1,
    hasIcon: false,
    iconMismatch: false,
    missingFieldInheritance: null,
    missingInheritanceStatus: 'none',
    isTemplate: false,
  }
}

describe('schemaIndices', () => {
  it('buildChildPresetIndex keeps the longest matching child id', () => {
    const presets = [
      { ...stubPreset('highway'), tags: { highway: '*' } },
      { ...stubPreset('highway/mini_roundabout'), tags: { highway: 'mini_roundabout' } },
      {
        ...stubPreset('highway/mini_roundabout/extra'),
        tags: { highway: 'mini_roundabout' },
      },
    ] as DenormalizedPreset[]

    const index = buildChildPresetIndex(presets)
    const key = childPresetLookupKey('highway', 'highway', 'mini_roundabout')
    expect(index.get(key)?.id).toBe('highway/mini_roundabout/extra')
  })

  it('buildFieldPresetIndex splits primary and more field usage', () => {
    const presets = [
      stubPreset('a', ['highway']),
      stubPreset('b', [], ['highway']),
      stubPreset('c', ['highway'], ['highway']),
    ]
    const { primary, more } = buildFieldPresetIndex(presets)
    expect(primary.get('highway')?.map((p) => p.id)).toEqual(['a', 'c'])
    expect(more.get('highway')?.map((p) => p.id)).toEqual(['b'])
  })

  it('precomputed field option rows match runtime helper', () => {
    const presets = [
      { ...stubPreset('highway', ['highway']), tags: { highway: '*' } },
      {
        ...stubPreset('highway/mini_roundabout'),
        tags: { highway: 'mini_roundabout' },
        name: 'Mini-Roundabout',
      },
    ] as DenormalizedPreset[]
    const fields = {
      highway: {
        key: 'highway',
        type: 'combo',
        options: ['mini_roundabout'],
        icons: { mini_roundabout: 'temaki-mini_roundabout' },
      },
    }
    const fieldTranslations = {
      highway: {
        label: 'Highway',
        options: { mini_roundabout: { title: 'Mini-Roundabout' } },
      },
    }

    const indices = buildSchemaIndices(presets, fields, fieldTranslations)
    const precomputed = indices.fieldOptionMismatchRows.get('highway') ?? []
    const runtime = getFieldOptionMismatchRows('highway', fields, fieldTranslations, presets)

    expect(precomputed).toEqual(runtime)
  })
})
