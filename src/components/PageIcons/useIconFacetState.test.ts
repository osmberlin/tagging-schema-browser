import { describe, expect, it } from 'vitest'
import type { IconViewModel } from '@/utils/types'
import {
  buildIconFacetMeta,
  iconBrowseNeedsFullCatalog,
  iconFacetCountsNeedFullCatalog,
} from './iconFacetMeta'

function icon(name: string, presetUsageCount: number, optionUsageCount = 0): IconViewModel {
  const prefix = name.split('-')[0] ?? 'unknown'
  return {
    name,
    prefix,
    presetUsageCount,
    optionUsageCount,
    usageCount: presetUsageCount + optionUsageCount,
    presets: [],
    optionUsages: [],
  }
}

describe('iconBrowseNeedsFullCatalog', () => {
  it('is true only for All and Unused usage facets', () => {
    expect(iconBrowseNeedsFullCatalog('all')).toBe(true)
    expect(iconBrowseNeedsFullCatalog('unused')).toBe(true)
    expect(iconBrowseNeedsFullCatalog('any')).toBe(false)
    expect(iconBrowseNeedsFullCatalog('presets')).toBe(false)
    expect(iconBrowseNeedsFullCatalog('options')).toBe(false)
  })
})

describe('iconFacetCountsNeedFullCatalog', () => {
  it('is true for All / Unused with every supplier', () => {
    expect(iconFacetCountsNeedFullCatalog('all', 'all')).toBe(true)
    expect(iconFacetCountsNeedFullCatalog('unused', 'all')).toBe(true)
  })

  it('is false when a single supplier or used-only facet is selected', () => {
    expect(iconFacetCountsNeedFullCatalog('any', 'all')).toBe(false)
    expect(iconFacetCountsNeedFullCatalog('unused', 'fab')).toBe(false)
    expect(iconFacetCountsNeedFullCatalog('presets', 'all')).toBe(false)
  })
})

describe('buildIconFacetMeta', () => {
  it('counts unused catalog icons alongside schema-referenced icons', () => {
    const icons = [icon('maki-cafe', 2), icon('fab-github', 0), icon('fab-gitlab', 0)]

    const meta = buildIconFacetMeta(icons)

    expect(meta.unusedCount).toBe(2)
    expect(meta.anyCount).toBe(1)
    expect(meta.anyCount + meta.unusedCount).toBe(icons.length)
  })
})
