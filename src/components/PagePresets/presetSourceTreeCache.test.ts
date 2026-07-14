import { describe, expect, it } from 'vitest'
import {
  clearPresetSourceTreeCache,
  isPresetSourceTreeWarm,
  markPresetSourceTreeWarm,
  presetSourceTreeCacheKey,
} from '@/components/PagePresets/presetSourceTreeCache'

describe('presetSourceTreeCache', () => {
  it('builds stable keys per schema, kind, and entity id', () => {
    const key = presetSourceTreeCacheKey({
      dataUrl: 'https://example.com/dist',
      sourceKind: 'field',
      entityId: 'highway',
    })
    expect(key).toContain('highway')
    expect(key).toContain('field')
    expect(
      presetSourceTreeCacheKey({
        dataUrl: 'https://example.com/dist/',
        sourceKind: 'field',
        entityId: 'highway',
      }),
    ).toBe(key)
  })

  it('tracks warm entries until cleared', () => {
    clearPresetSourceTreeCache()
    const key = presetSourceTreeCacheKey({
      dataUrl: 'https://example.com/dist/',
      sourceKind: 'preset',
      entityId: 'highway/mini_roundabout',
    })
    expect(isPresetSourceTreeWarm(key)).toBe(false)
    markPresetSourceTreeWarm(key)
    expect(isPresetSourceTreeWarm(key)).toBe(true)
    clearPresetSourceTreeCache()
    expect(isPresetSourceTreeWarm(key)).toBe(false)
  })
})
