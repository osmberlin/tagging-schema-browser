import { describe, expect, it } from 'vitest'
import { defaultComparisonTab } from '@/utils/comparisonTab'

describe('defaultComparisonTab', () => {
  it('prefers presets when they changed', () => {
    expect(defaultComparisonTab({ presets: 2, fields: 1, categories: 0 })).toBe('presets')
  })
  it('falls back to fields when presets are unchanged', () => {
    expect(defaultComparisonTab({ presets: 0, fields: 3, categories: 1 })).toBe('fields')
  })
  it('falls back to categories when only categories changed', () => {
    expect(defaultComparisonTab({ presets: 0, fields: 0, categories: 1 })).toBe('categories')
  })
  it('stays on presets when nothing changed', () => {
    expect(defaultComparisonTab({ presets: 0, fields: 0, categories: 0 })).toBe('presets')
  })
})
