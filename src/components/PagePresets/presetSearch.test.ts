import { describe, expect, it } from 'vitest'
import {
  activatePresetSearchIndex,
  ensurePresetSearchIndex,
  PRESET_SEARCH_ALL,
  searchPresets,
} from '@/components/PagePresets/presetSearch'
import type { DenormalizedPreset } from '@/utils/types'

function preset(id: string, name: string): DenormalizedPreset {
  return {
    id,
    name,
    terms: [],
    aliases: [],
    tags: {},
    tagString: '',
    geometry: ['point'],
    categoryIds: [],
    categoryNames: [],
    fields: [],
    moreFields: [],
    matchScore: 0,
    hasIcon: false,
    missingFieldInheritance: null,
    missingInheritanceStatus: 'none',
  }
}

describe('presetSearch index', () => {
  it('keeps search results scoped to the active data URL', () => {
    const releasePresets = [preset('release/a', 'Release A')]
    const stagingPresets = [preset('staging/b', 'Staging B')]

    activatePresetSearchIndex('https://release.example/', releasePresets)
    expect(
      searchPresets({ page: 1, per_page: PRESET_SEARCH_ALL })?.data.items.map((p) => p.id),
    ).toEqual(['release/a'])

    activatePresetSearchIndex('https://staging.example/', stagingPresets)
    expect(
      searchPresets({ page: 1, per_page: PRESET_SEARCH_ALL })?.data.items.map((p) => p.id),
    ).toEqual(['staging/b'])
  })

  it('does not rebuild the index when ensure is called for the same URL', () => {
    const first = [preset('a', 'A')]
    const second = [preset('b', 'B')]

    activatePresetSearchIndex('https://same.example/', first)
    ensurePresetSearchIndex('https://same.example/', second)

    expect(
      searchPresets({ page: 1, per_page: PRESET_SEARCH_ALL })?.data.items.map((p) => p.id),
    ).toEqual(['a'])
  })
})
