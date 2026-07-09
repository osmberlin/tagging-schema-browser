import { describe, expect, it } from 'vitest'
import { INTEREM_DATA_URL, RELEASE_DATA_URL } from './constants'
import {
  dataUrlForReference,
  isCanonicalDataUrl,
  isReleaseCompareMode,
  isReleaseDataUrl,
  referenceSearchParam,
  resolveActiveDataUrl,
  resolveCompareBaselineUrl,
  resolveSchemaReference,
} from './dataUrl'

describe('resolveSchemaReference', () => {
  it('prefers explicit URL reference over persisted', () => {
    expect(resolveSchemaReference('release', 'interem')).toBe('release')
    expect(resolveSchemaReference('interem', 'release')).toBe('interem')
  })

  it('falls back to persisted when URL omits reference', () => {
    expect(resolveSchemaReference(undefined, 'interem')).toBe('interem')
    expect(resolveSchemaReference(undefined, 'release')).toBe('release')
  })
})

describe('resolveActiveDataUrl', () => {
  it('uses canonical interem when dataUrl is empty', () => {
    expect(resolveActiveDataUrl('', 'interem')).toBe(INTEREM_DATA_URL)
  })

  it('uses custom dataUrl when set', () => {
    const custom = 'https://example.com/dist/'
    expect(resolveActiveDataUrl(custom, 'interem')).toBe(custom)
  })

  it('switches to release dist in release-compare mode', () => {
    const preview = 'https://deploy-preview.netlify.app/dist/'
    expect(resolveActiveDataUrl(preview, 'release')).toBe(RELEASE_DATA_URL)
    expect(isReleaseCompareMode(preview, 'release')).toBe(true)
  })
})

describe('referenceSearchParam', () => {
  it('omits param for interem default', () => {
    expect(referenceSearchParam('interem')).toBeUndefined()
    expect(referenceSearchParam('release')).toBe('release')
  })
})

describe('isCanonicalDataUrl', () => {
  it('recognizes release and interem URLs', () => {
    expect(isCanonicalDataUrl(RELEASE_DATA_URL)).toBe(true)
    expect(isCanonicalDataUrl(INTEREM_DATA_URL)).toBe(true)
    expect(isCanonicalDataUrl('https://preview.example/dist/')).toBe(false)
  })
})

describe('resolveCompareBaselineUrl', () => {
  it('returns preview URL in release-compare mode', () => {
    const preview = 'https://deploy-preview.netlify.app/dist/'
    expect(resolveCompareBaselineUrl(preview, 'release')).toBe(
      'https://deploy-preview.netlify.app/dist/',
    )
  })

  it('returns interem for custom preview builds', () => {
    expect(resolveCompareBaselineUrl('https://preview.example/dist/', 'interem')).toBe(
      INTEREM_DATA_URL,
    )
  })

  it('returns null on canonical datasets', () => {
    expect(resolveCompareBaselineUrl('', 'interem')).toBeNull()
    expect(resolveCompareBaselineUrl(RELEASE_DATA_URL, 'release')).toBeNull()
  })
})

describe('dataUrlForReference', () => {
  it('maps reference to dist URL', () => {
    expect(dataUrlForReference('release')).toBe(RELEASE_DATA_URL)
    expect(dataUrlForReference('interem')).toBe(INTEREM_DATA_URL)
  })
})

describe('isReleaseDataUrl', () => {
  it('recognizes npm release dist URLs', () => {
    expect(isReleaseDataUrl(RELEASE_DATA_URL)).toBe(true)
    expect(
      isReleaseDataUrl(
        'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@6.18.0/dist/',
      ),
    ).toBe(true)
  })

  it('rejects staging, interim, and preview dist URLs', () => {
    expect(isReleaseDataUrl(INTEREM_DATA_URL)).toBe(false)
    expect(isReleaseDataUrl('https://preview.example/dist/')).toBe(false)
    expect(isReleaseDataUrl('https://pr-42--ideditor-presets-preview.netlify.app/dist/')).toBe(
      false,
    )
  })
})
