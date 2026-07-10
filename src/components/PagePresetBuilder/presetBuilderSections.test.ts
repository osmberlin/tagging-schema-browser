import { describe, expect, it } from 'vitest'
import {
  presetBuilderSearchSchema,
  searchToBuilderState,
} from '@/components/PagePresetBuilder/presetBuilderSearch'
import { sectionOpenWhen } from '@/components/PagePresetBuilder/presetBuilderSections'
import { PRESET_BUILDER_DEFAULTS } from '@/components/PagePresetBuilder/presetBuilderUtils'

describe('presetBuilderSearch', () => {
  it('parses router JSON object tags', () => {
    const search = presetBuilderSearchSchema.parse({ pb_tags: { amenity: 'cafe' } })
    expect(searchToBuilderState(search).tags).toEqual({ amenity: 'cafe' })
  })
})

describe('sectionOpenWhen', () => {
  it('is false for empty defaults', () => {
    expect(sectionOpenWhen('labels', PRESET_BUILDER_DEFAULTS)).toBe(false)
    expect(sectionOpenWhen('moreFields', PRESET_BUILDER_DEFAULTS)).toBe(false)
  })

  it('opens sections with committed URL values', () => {
    const state = {
      ...PRESET_BUILDER_DEFAULTS,
      tags: { amenity: 'cafe' },
      geometry: ['point'],
      moreFields: ['name'],
    }
    expect(sectionOpenWhen('geometry', state)).toBe(true)
    expect(sectionOpenWhen('moreFields', state)).toBe(true)
    expect(sectionOpenWhen('labels', state)).toBe(false)
  })
})
