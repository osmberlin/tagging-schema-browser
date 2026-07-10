import { describe, expect, it } from 'vitest'
import { osmWikiKeyUrl, osmWikiTagUrl, osmWikiUrlForTag } from './osmWikiUrl'

describe('osmWikiKeyUrl', () => {
  it('links simple keys', () => {
    expect(osmWikiKeyUrl('name')).toBe('https://wiki.openstreetmap.org/wiki/Key:name')
  })

  it('keeps colons in namespaced keys', () => {
    expect(osmWikiKeyUrl('addr:street')).toBe('https://wiki.openstreetmap.org/wiki/Key:addr:street')
  })
})

describe('osmWikiTagUrl', () => {
  it('encodes the equals sign between key and value', () => {
    expect(osmWikiTagUrl('substation', 'minor_distribution')).toBe(
      'https://wiki.openstreetmap.org/wiki/Tag:substation%3Dminor_distribution',
    )
  })

  it('encodes shop tag values', () => {
    expect(osmWikiTagUrl('shop', 'interior_decoration')).toBe(
      'https://wiki.openstreetmap.org/wiki/Tag:shop%3Dinterior_decoration',
    )
  })
})

describe('osmWikiUrlForTag', () => {
  it('uses a tag page when a value is present', () => {
    expect(osmWikiUrlForTag('amenity', 'cafe')).toBe(
      'https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dcafe',
    )
  })

  it('falls back to a key page without a value', () => {
    expect(osmWikiUrlForTag('name')).toBe('https://wiki.openstreetmap.org/wiki/Key:name')
  })
})
