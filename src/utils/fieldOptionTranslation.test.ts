import { describe, expect, it } from 'vitest'
import {
  fieldOptionDescription,
  fieldOptionTitle,
  fieldOptionTranslateTexts,
  hasFieldOptionTranslation,
} from '@/utils/fieldOptionTranslation'

describe('fieldOptionTranslation', () => {
  it('reads plain string options', () => {
    expect(fieldOptionTitle('Bench')).toBe('Bench')
    expect(fieldOptionDescription('Bench')).toBeUndefined()
    expect(hasFieldOptionTranslation('Bench')).toBe(true)
    expect(fieldOptionTranslateTexts('Bench')).toEqual(['Bench'])
  })

  it('reads structured marker-style options', () => {
    const option = {
      title: 'Aerial',
      description: 'Designed to be visible from the air.',
    }

    expect(fieldOptionTitle(option)).toBe('Aerial')
    expect(fieldOptionDescription(option)).toBe('Designed to be visible from the air.')
    expect(hasFieldOptionTranslation(option)).toBe(true)
    expect(fieldOptionTranslateTexts(option)).toEqual([
      'Aerial',
      'Designed to be visible from the air.',
    ])
  })

  it('ignores empty values', () => {
    expect(hasFieldOptionTranslation('   ')).toBe(false)
    expect(hasFieldOptionTranslation({ title: ' ', description: '' })).toBe(false)
  })
})
