import { describe, expect, it } from 'vitest'
import { optionLeadsToPreset } from '@/utils/childPresetMatch'

describe('optionLeadsToPreset', () => {
  it('accepts a child that only adds the option', () => {
    expect(
      optionLeadsToPreset(
        { tags: { amenity: 'restaurant' } },
        { tags: { amenity: 'restaurant', cuisine: 'pizza' } },
        'cuisine',
        'pizza',
      ),
    ).toBe(true)
  })

  it('rejects an option that is the parent’s own tag', () => {
    expect(
      optionLeadsToPreset(
        { tags: { amenity: 'place_of_worship', religion: 'christian' } },
        {
          tags: {
            amenity: 'place_of_worship',
            religion: 'christian',
            denomination: 'jehovahs_witness',
          },
        },
        'religion',
        'christian',
      ),
    ).toBe(false)
  })

  it('rejects a child that needs a further tag', () => {
    expect(
      optionLeadsToPreset(
        { tags: { amenity: 'social_facility' } },
        {
          tags: {
            amenity: 'social_facility',
            social_facility: 'assisted_living',
            'social_facility:for': 'senior',
          },
        },
        'social_facility',
        'assisted_living',
      ),
    ).toBe(false)
  })

  it('accepts an option that replaces the parent’s value', () => {
    expect(
      optionLeadsToPreset(
        { tags: { highway: 'raceway', sport: 'motor' } },
        { tags: { highway: 'raceway', sport: 'karting' } },
        'sport',
        'karting',
      ),
    ).toBe(true)
  })

  it('counts tags the parent writes via addTags', () => {
    expect(
      optionLeadsToPreset(
        { tags: { amenity: 'clinic' }, addTags: { amenity: 'clinic', healthcare: 'clinic' } },
        {
          tags: { amenity: 'clinic', healthcare: 'clinic', 'healthcare:speciality': 'abortion' },
        },
        'healthcare:speciality',
        'abortion',
      ),
    ).toBe(true)
  })
})
