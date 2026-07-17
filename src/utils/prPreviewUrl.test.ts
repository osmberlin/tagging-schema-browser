import { describe, expect, it } from 'vitest'
import { isPrPreviewDataUrl, prNumberFromDataUrl, prPreviewDataUrl } from './prPreviewUrl'

describe('isPrPreviewDataUrl', () => {
  it('recognizes Netlify PR preview dist URLs', () => {
    expect(isPrPreviewDataUrl(prPreviewDataUrl(2477))).toBe(true)
    expect(isPrPreviewDataUrl('https://pr-42--ideditor-presets-preview.netlify.app/dist/')).toBe(
      true,
    )
  })

  it('rejects npm, interim, and arbitrary hosts', () => {
    expect(
      isPrPreviewDataUrl('https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@7/dist/'),
    ).toBe(false)
    expect(isPrPreviewDataUrl('https://openstreetmap.github.io/id-tagging-schema/dist/')).toBe(
      false,
    )
    expect(isPrPreviewDataUrl('https://example.com/dist/')).toBe(false)
    expect(isPrPreviewDataUrl('')).toBe(false)
  })
})

describe('prNumberFromDataUrl', () => {
  it('extracts PR number from Netlify preview URLs', () => {
    expect(prNumberFromDataUrl(prPreviewDataUrl(2477))).toBe(2477)
    expect(prNumberFromDataUrl('https://pr-42--ideditor-presets-preview.netlify.app/dist/')).toBe(
      42,
    )
  })

  it('returns null for non-preview URLs', () => {
    expect(prNumberFromDataUrl('https://example.com/dist/')).toBeNull()
    expect(prNumberFromDataUrl('')).toBeNull()
  })
})
