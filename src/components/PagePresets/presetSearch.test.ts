import { describe, expect, it } from 'vitest'
import {
  activatePresetSearchIndex,
  ensurePresetSearchIndex,
  PRESET_SEARCH_ALL,
  refreshPresetSearchIndex,
  searchPresets,
} from '@/components/PagePresets/presetSearch'
import type { DenormalizedPreset } from '@/utils/types'

function preset(
  id: string,
  name: string,
  overrides: Partial<DenormalizedPreset> = {},
): DenormalizedPreset {
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
    iconMismatch: false,
    missingFieldInheritance: null,
    missingInheritanceStatus: 'none',
    isTemplate: false,
    ...overrides,
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

  it('reuses a cached engine when switching back to a previously active URL', () => {
    const releasePresets = [preset('release/a', 'Release A')]
    const stagingPresets = [preset('staging/b', 'Staging B')]

    activatePresetSearchIndex('https://release.example/', releasePresets)
    activatePresetSearchIndex('https://staging.example/', stagingPresets)
    activatePresetSearchIndex('https://release.example/', [
      preset('release/overwritten', 'Should not apply'),
    ])

    expect(
      searchPresets({ page: 1, per_page: PRESET_SEARCH_ALL })?.data.items.map((p) => p.id),
    ).toEqual(['release/a'])
  })

  it('refreshing a non-active URL does not repoint search results', () => {
    activatePresetSearchIndex('https://active.example/', [preset('active/a', 'Active A')])
    refreshPresetSearchIndex('https://prefetch.example/', [preset('prefetch/b', 'Prefetch B')])

    expect(
      searchPresets({ page: 1, per_page: PRESET_SEARCH_ALL })?.data.items.map((p) => p.id),
    ).toEqual(['active/a'])
  })

  it('filters template and searchable facets', () => {
    const presets = [
      preset('amenity/cafe', 'Cafe', { searchable: true, isTemplate: false }),
      preset('@templates/poi', 'Template POI', { searchable: false, isTemplate: true }),
      preset('shop/ice_cream', 'Ice cream shop', { searchable: false, isTemplate: false }),
    ]

    activatePresetSearchIndex('https://facet.example/', presets)

    expect(
      searchPresets({
        filters: { template: ['no'] },
        page: 1,
        per_page: PRESET_SEARCH_ALL,
      })?.data.items.map((p) => p.id),
    ).toEqual(['amenity/cafe', 'shop/ice_cream'])

    expect(
      searchPresets({
        filters: { template: ['yes'] },
        page: 1,
        per_page: PRESET_SEARCH_ALL,
      })?.data.items.map((p) => p.id),
    ).toEqual(['@templates/poi'])

    expect(
      searchPresets({
        filters: { searchable: ['no'] },
        page: 1,
        per_page: PRESET_SEARCH_ALL,
      })?.data.items.map((p) => p.id),
    ).toEqual(['shop/ice_cream', '@templates/poi'])
  })

  it('excludes expected no-icon presets when filtering hasIcon no', () => {
    const presets = [
      preset('line', 'Line', { hasIcon: false }),
      preset('point', 'Point', { hasIcon: false }),
      preset('area', 'Area', { hasIcon: false }),
      preset('address', 'Address', { hasIcon: false }),
      preset('highway/crossing', 'Crossing', { hasIcon: false }),
    ]

    activatePresetSearchIndex('https://expected-no-icon.example/', presets)

    expect(
      searchPresets({
        filters: { hasIcon: ['no'] },
        page: 1,
        per_page: PRESET_SEARCH_ALL,
      })?.data.items.map((p) => p.id),
    ).toEqual(['highway/crossing'])

    const result = searchPresets({
      filters: { hasIcon: ['no'] },
      page: 1,
      per_page: PRESET_SEARCH_ALL,
    })
    expect(result?.data.total).toBe(1)
    expect(result?.data.items).toHaveLength(1)
  })
})
