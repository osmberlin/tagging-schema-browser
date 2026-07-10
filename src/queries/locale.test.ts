import { afterEach, describe, expect, it, vi } from 'vitest'
import { INTERIM_DATA_URL, RELEASE_DATA_URL } from '@/utils/constants'
import { discoverLocales } from './locale'

describe('discoverLocales', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('uses jsDelivr API for release dist without fetching locales.json', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input: RequestInfo | URL) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        if (url.includes('/resolved?')) {
          return new Response(JSON.stringify({ version: '6.18.0' }), { status: 200 })
        }
        return new Response(
          JSON.stringify({
            files: [
              {
                type: 'directory',
                name: 'dist',
                files: [
                  {
                    type: 'directory',
                    name: 'translations',
                    files: [
                      { type: 'file', name: 'de.min.json' },
                      { type: 'file', name: 'fr.min.json' },
                    ],
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        )
      })

    const locales = await discoverLocales(
      'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@latest/dist/',
    )

    expect(locales).toEqual(['de', 'fr'])
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('translations/locales.json'))
  })

  it('accepts release dist URLs for locale discovery', async () => {
    const locales = await discoverLocales(RELEASE_DATA_URL)
    expect(Array.isArray(locales)).toBe(true)
  })
})
