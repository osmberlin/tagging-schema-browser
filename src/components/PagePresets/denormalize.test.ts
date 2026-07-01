import { describe, expect, it } from 'vitest'
import { denormalize } from '@/components/PagePresets/denormalize'

describe('denormalize', () => {
  it('resolves preset name from English translations', () => {
    const presets = {
      'amenity/cafe': { tags: { amenity: 'cafe' }, geometry: ['point'], fields: [] },
    }
    const translations = {
      en: {
        presets: {
          presets: { 'amenity/cafe': { name: 'Café' } },
          categories: {},
          fields: {},
        },
      },
    }

    const result = denormalize(presets, translations, {}, {})

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Café')
    expect(result[0]?.id).toBe('amenity/cafe')
  })
})
