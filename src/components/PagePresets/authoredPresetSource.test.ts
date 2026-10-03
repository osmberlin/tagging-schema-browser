import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authoredPresetSourceUrls,
  buildAuthoredPresetSource,
  clearAuthoredPresetSourceCache,
  formatFieldOmission,
  loadAuthoredPresetSource,
} from '@/components/PagePresets/authoredPresetSource'
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

function listItems(
  source: ReturnType<typeof buildAuthoredPresetSource>,
  key: 'fields' | 'moreFields',
) {
  return source?.[key]?.map((entry) => (entry.kind === 'field' ? entry.fieldId : entry.presetRef))
}

describe('buildAuthoredPresetSource', () => {
  it('keeps the authored lists and records what each reference expands to', () => {
    const source = buildAuthoredPresetSource('amenity/cafe', cafeAuthored, rawPresets, allFields)

    expect(listItems(source, 'fields')).toEqual(cafeAuthored.fields)
    expect(listItems(source, 'moreFields')).toEqual(cafeAuthored.moreFields)
    expect(source?.fields?.[2]).toEqual({
      kind: 'presetRef',
      presetRef: '{building}',
      presetId: 'building',
      fields: [
        {
          fieldId: 'name',
          omission: {
            kind: 'sameKey',
            hostPresetId: 'amenity/cafe',
            fieldListKey: 'fields',
            blockingFieldId: 'name',
            tagKey: 'name',
          },
        },
        { fieldId: 'building', omission: undefined },
        { fieldId: 'levels', omission: undefined },
        { fieldId: 'height', omission: undefined },
      ],
    })
  })

  it('drops referenced fields whose key is fixed by a preset tag', () => {
    const presets: RawPresets = {
      ...rawPresets,
      'building/house': { tags: { building: 'house' }, fields: ['name', 'levels', 'height'] },
    }
    const source = buildAuthoredPresetSource(
      'building/house',
      { fields: ['{building}'] },
      presets,
      allFields,
    )
    const ref = source?.fields?.[0]
    const omitted = ref?.kind === 'presetRef' ? ref.fields.find((field) => field.omission) : null

    expect(omitted?.fieldId).toBe('building')
    expect(formatFieldOmission('building', omitted!.omission!)).toBe(
      'building/house tag fixes building=house',
    )
  })

  it('explains a field blocked by another field with the same tag key', () => {
    expect(
      formatFieldOmission('direction_point', {
        kind: 'sameKey',
        hostPresetId: 'traffic_sign/variable_message',
        fieldListKey: 'fields',
        blockingFieldId: 'direction_vertex',
        tagKey: 'direction',
      }),
    ).toBe(
      'direction_point blocked by direction_vertex on traffic_sign/variable_message (fields, same tag key `direction`)',
    )
  })

  it('rejects a source whose expansion differs from the dist', () => {
    const build = (authored: { fields?: string[]; moreFields?: string[] }) =>
      buildAuthoredPresetSource('amenity/cafe', authored, rawPresets, allFields)

    expect(build({ ...cafeAuthored, fields: ['name', '{building}'] })).toBeNull()
    expect(build({ fields: cafeAuthored.fields })).toBeNull()
    expect(build({ ...cafeAuthored, fields: ['name', 'cuisine', '{unknown/preset}'] })).toBeNull()
  })

  it('never invents a reference the source does not have', () => {
    const presets: RawPresets = {
      ...rawPresets,
      'type/route/road': { tags: { route: 'road' }, moreFields: ['colour', 'distance'] },
    }
    const source = buildAuthoredPresetSource(
      'type/route/road',
      { moreFields: ['colour', 'distance'] },
      presets,
      allFields,
    )
    expect(listItems(source, 'moreFields')).toEqual(['colour', 'distance'])
  })
})

describe('loadAuthoredPresetSource', () => {
  const dataUrl = 'https://example.com/schema/dist/'
  const params = { dataUrl, presetId: 'amenity/cafe', rawPresets, allFields }

  beforeEach(() => clearAuthoredPresetSourceCache())

  it('returns the authored lists when they match the dist', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ name: 'Cafe', ...cafeAuthored }))
    const source = await loadAuthoredPresetSource({ ...params, fetchImpl })
    expect(listItems(source, 'fields')).toEqual(cafeAuthored.fields)
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
      clearAuthoredPresetSourceCache()
      await expect(loadAuthoredPresetSource({ ...params, fetchImpl })).resolves.toBeNull()
    }
  })

  it('falls back when the request times out', async () => {
    const fetchImpl = (_url: string, init?: { signal?: AbortSignal }) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal!.reason))
      })
    await expect(
      loadAuthoredPresetSource({ ...params, fetchImpl, timeoutMs: 5 }),
    ).resolves.toBeNull()
  })

  it('uses a dist that still carries references as its own source, without fetching', async () => {
    const presets: RawPresets = {
      ...rawPresets,
      'building/house': { tags: { building: 'house' }, fields: ['{building}'] },
    }
    const fetchImpl = vi.fn(async () => jsonResponse({}))
    const source = await loadAuthoredPresetSource({
      ...params,
      presetId: 'building/house',
      rawPresets: presets,
      fetchImpl,
    })
    expect(listItems(source, 'fields')).toEqual(['{building}'])
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('tries the next candidate when the first does not match', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes('/merge/') ? jsonResponse({ fields: ['name'] }) : jsonResponse(cafeAuthored),
    )
    await expect(
      loadAuthoredPresetSource({
        ...params,
        dataUrl: 'https://pr-12--ideditor-presets-preview.netlify.app/dist/',
        fetchImpl,
      }),
    ).resolves.not.toBeNull()
    expect(fetchImpl.mock.calls.at(-1)![0]).toContain('/refs/pull/12/head/')
  })

  it('caches per dataUrl and preset, but retries after a network error', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(cafeAuthored))
    await loadAuthoredPresetSource({ ...params, fetchImpl })
    await loadAuthoredPresetSource({
      ...params,
      dataUrl: 'https://example.com/schema/dist',
      fetchImpl,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(1)

    await loadAuthoredPresetSource({ ...params, presetId: 'building', fetchImpl })
    await loadAuthoredPresetSource({
      ...params,
      dataUrl: 'https://example.com/other/dist/',
      fetchImpl,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(4)

    clearAuthoredPresetSourceCache()
    const failing = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(loadAuthoredPresetSource({ ...params, fetchImpl: failing })).resolves.toBeNull()
    await expect(loadAuthoredPresetSource({ ...params, fetchImpl })).resolves.not.toBeNull()
  })
})
