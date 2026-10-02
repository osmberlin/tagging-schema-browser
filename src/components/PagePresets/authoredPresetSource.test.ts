import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authoredPresetSourceUrls,
  clearAuthoredFieldListsCache,
  expandAuthoredFieldLists,
  loadAuthoredFieldLists,
  validateAuthoredFieldLists,
} from '@/components/PagePresets/authoredPresetSource'
import {
  displayPresetFieldList,
  withAuthoredFieldLists,
} from '@/components/PagePresets/presetFieldInheritance'
import { INTERIM_DATA_URL, RELEASE_DATA_URL } from '@/utils/constants'
import type { RawFields, RawPresets } from '@/utils/types'

const RAW = 'https://raw.githubusercontent.com/openstreetmap/id-tagging-schema'

const allFields: RawFields = {
  name: { key: 'name', type: 'localized' },
  building: { key: 'building', type: 'combo' },
  levels: { key: 'building:levels', type: 'number' },
  height: { key: 'height', type: 'number' },
  amenity: { key: 'amenity', type: 'typeCombo' },
  cuisine: { key: 'cuisine', type: 'semiCombo' },
  colour: { key: 'colour', type: 'colour' },
  distance: { key: 'distance', type: 'text' },
}

const rawPresets: RawPresets = {
  building: {
    tags: { building: '*' },
    geometry: ['area'],
    fields: ['name', 'building', 'levels', 'height'],
    moreFields: ['colour'],
  },
  'amenity/cafe': {
    tags: { amenity: 'cafe' },
    geometry: ['point', 'area'],
    fields: ['name', 'cuisine', 'building', 'levels', 'height'],
    moreFields: ['colour', 'distance'],
  },
  'roller_coaster/support': {
    tags: { roller_coaster: 'support' },
    geometry: ['point'],
    moreFields: ['colour'],
  },
}

const cafeAuthored = {
  fields: ['name', 'cuisine', '{building}'],
  moreFields: ['{building}', 'distance'],
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('authoredPresetSourceUrls', () => {
  it('uses the data/ directory next to dist/ for an npm release', () => {
    expect(authoredPresetSourceUrls(RELEASE_DATA_URL, 'amenity/cafe')[0]).toBe(
      'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@latest/data/presets/amenity/cafe.json',
    )
    expect(
      authoredPresetSourceUrls(
        'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@7.2.0/dist/',
        'amenity/bus_station',
        { searchable: false },
      ),
    ).toEqual([
      'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@7.2.0/data/presets/amenity/_bus_station.json',
      'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@7.2.0/data/presets/amenity/bus_station.json',
    ])
  })

  it('maps the unreleased dist to main on raw GitHub', () => {
    expect(authoredPresetSourceUrls(INTERIM_DATA_URL, 'amenity/cafe')[0]).toBe(
      `${RAW}/main/data/presets/amenity/cafe.json`,
    )
  })

  it('maps a PR preview to the PR merge ref, then head', () => {
    const urls = authoredPresetSourceUrls(
      'https://pr-3035--ideditor-presets-preview.netlify.app/dist/',
      '@templates/contact',
      { searchable: false },
    )
    expect(urls[0]).toBe(`${RAW}/refs/pull/3035/merge/data/presets/@templates/contact.json`)
    expect(urls).toContain(`${RAW}/refs/pull/3035/head/data/presets/@templates/contact.json`)
  })

  it('returns no candidates for a preview URL without a PR number', () => {
    expect(
      authoredPresetSourceUrls('https://ideditor-presets-preview.netlify.app/dist/', 'building'),
    ).toEqual([])
  })
})

describe('validateAuthoredFieldLists', () => {
  it('expands refs like the schema build and accepts a matching source', () => {
    expect(
      expandAuthoredFieldLists(rawPresets['amenity/cafe']!, cafeAuthored, rawPresets, allFields),
    ).toEqual({
      fields: ['name', 'cuisine', 'building', 'levels', 'height'],
      moreFields: ['colour', 'distance'],
    })
    expect(
      validateAuthoredFieldLists(rawPresets['amenity/cafe']!, cafeAuthored, rawPresets, allFields),
    ).toBe(true)
  })

  it('drops referenced fields whose key is fixed by a preset tag', () => {
    const presets: RawPresets = {
      ...rawPresets,
      'building/house': { tags: { building: 'house' }, fields: ['name', 'levels', 'height'] },
    }
    expect(
      validateAuthoredFieldLists(
        presets['building/house']!,
        { fields: ['{building}'] },
        presets,
        allFields,
      ),
    ).toBe(true)
  })

  it('rejects a source whose expansion differs from the dist', () => {
    const dist = rawPresets['amenity/cafe']!
    expect(
      validateAuthoredFieldLists(
        dist,
        { ...cafeAuthored, fields: ['name', '{building}'] },
        rawPresets,
        allFields,
      ),
    ).toBe(false)
    expect(
      validateAuthoredFieldLists(dist, { fields: cafeAuthored.fields }, rawPresets, allFields),
    ).toBe(false)
    expect(
      validateAuthoredFieldLists(
        dist,
        { ...cafeAuthored, fields: ['name', 'cuisine', '{unknown/preset}'] },
        rawPresets,
        allFields,
      ),
    ).toBe(false)
  })
})

describe('loadAuthoredFieldLists', () => {
  const dataUrl = 'https://example.com/schema/dist/'
  const params = { dataUrl, presetId: 'amenity/cafe', rawPresets, allFields }

  beforeEach(() => clearAuthoredFieldListsCache())

  it('returns the authored lists when they match the dist', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ name: 'Cafe', ...cafeAuthored }))
    await expect(loadAuthoredFieldLists({ ...params, fetchImpl })).resolves.toEqual(cafeAuthored)
    expect(fetchImpl.mock.calls[0]![0]).toBe(
      'https://example.com/schema/data/presets/amenity/cafe.json',
    )
  })

  it('falls back (null) on mismatch, 404, invalid JSON and network errors', async () => {
    const cases = [
      async () => jsonResponse({ fields: ['name'] }),
      async () => jsonResponse('Not found', 404),
      async () => new Response('<!doctype html>', { status: 200 }),
      async () => {
        throw new TypeError('Failed to fetch')
      },
    ]
    for (const fetchImpl of cases) {
      clearAuthoredFieldListsCache()
      await expect(loadAuthoredFieldLists({ ...params, fetchImpl })).resolves.toBeNull()
    }
  })

  it('falls back when the request times out', async () => {
    const fetchImpl = (_url: string, init?: { signal?: AbortSignal }) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal!.reason))
      })
    await expect(loadAuthoredFieldLists({ ...params, fetchImpl, timeoutMs: 5 })).resolves.toBeNull()
  })

  it('tries the next candidate when the first does not match', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes('/merge/') ? jsonResponse({ fields: ['name'] }) : jsonResponse(cafeAuthored),
    )
    await expect(
      loadAuthoredFieldLists({
        ...params,
        dataUrl: 'https://pr-12--ideditor-presets-preview.netlify.app/dist/',
        fetchImpl,
      }),
    ).resolves.toEqual(cafeAuthored)
    expect(fetchImpl.mock.calls.at(-1)![0]).toContain('/refs/pull/12/head/')
  })

  it('caches per dataUrl and preset, but retries after a network error', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(cafeAuthored))
    await loadAuthoredFieldLists({ ...params, fetchImpl })
    await loadAuthoredFieldLists({
      ...params,
      dataUrl: 'https://example.com/schema/dist',
      fetchImpl,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(1)

    await loadAuthoredFieldLists({ ...params, presetId: 'building', fetchImpl })
    await loadAuthoredFieldLists({
      ...params,
      dataUrl: 'https://example.com/other/dist/',
      fetchImpl,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(4)

    clearAuthoredFieldListsCache()
    const failing = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(loadAuthoredFieldLists({ ...params, fetchImpl: failing })).resolves.toBeNull()
    await expect(loadAuthoredFieldLists({ ...params, fetchImpl })).resolves.toEqual(cafeAuthored)
  })
})

describe('withAuthoredFieldLists', () => {
  it('shows authored lists as written, without reconstructing refs', () => {
    const routePresets: RawPresets = {
      ...rawPresets,
      'type/route/road': { tags: { route: 'road' }, moreFields: ['colour', 'distance'] },
    }
    const authored = { moreFields: ['colour', 'distance'] }
    const overlay = withAuthoredFieldLists(routePresets, 'type/route/road', authored)

    expect(
      displayPresetFieldList('type/route/road', 'moreFields', authored.moreFields, overlay),
    ).toEqual(['colour', 'distance'])
    expect(overlay['type/route/road']).not.toBe(routePresets['type/route/road'])
    expect(routePresets['type/route/road']!.moreFields).toEqual(['colour', 'distance'])
  })
})
