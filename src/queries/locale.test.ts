import { describe, expect, it } from 'vitest'
import { INTEREM_DATA_URL, RELEASE_DATA_URL } from '@/utils/constants'
import { discoverLocales } from './locale'

describe('discoverLocales', () => {
  it('returns no locales for staging and preview dist URLs', async () => {
    await expect(discoverLocales(INTEREM_DATA_URL)).resolves.toEqual([])
    await expect(
      discoverLocales('https://pr-42--ideditor-presets-preview.netlify.app/dist/'),
    ).resolves.toEqual([])
  })

  it('does not use the release fallback list for non-release dist URLs', async () => {
    const locales = await discoverLocales('https://example.com/dist/')
    expect(locales).toEqual([])
    expect(locales).not.toContain('de')
  })

  it('accepts release dist URLs for locale discovery', async () => {
    const locales = await discoverLocales(RELEASE_DATA_URL)
    expect(Array.isArray(locales)).toBe(true)
  })
})
