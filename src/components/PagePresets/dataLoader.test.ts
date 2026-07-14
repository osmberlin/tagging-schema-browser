import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadSchemaData, SCHEMA_CORE_FILES } from '@/components/PagePresets/dataLoader'

vi.mock('@/utils/schemaFetch', () => ({
  fetchSchemaJson: vi.fn(async (url: string) => {
    if (url.endsWith('presets.min.json')) return { 'amenity/cafe': {} }
    if (url.endsWith('translations/en.min.json'))
      return { en: { presets: { presets: {}, categories: {}, fields: {} } } }
    if (url.endsWith('preset_categories.min.json')) return {}
    if (url.endsWith('fields.min.json')) return {}
    if (url.endsWith('preset_defaults.min.json')) {
      throw new Error('preset_defaults should not be fetched')
    }
    throw new Error(`Unexpected fetch: ${url}`)
  }),
}))

describe('loadSchemaData', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads only the four core schema files', async () => {
    const payload = await loadSchemaData('https://example.com/dist')

    expect(payload.loadErrors).toEqual([])
    expect(Object.keys(payload.presets)).toEqual(['amenity/cafe'])
    expect(SCHEMA_CORE_FILES).toHaveLength(4)
    expect(SCHEMA_CORE_FILES).not.toContain('preset_defaults.min.json')
  })
})
