import { describe, expect, it } from 'vitest'
import { isPrPreviewDataUrl, prPreviewDataUrl } from './prPreviewUrl'

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
