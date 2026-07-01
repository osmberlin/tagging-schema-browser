import { describe, expect, it } from 'vitest'
import { routerSearch } from './routerSearch'

describe('routerSearch.stringify', () => {
  it('decodes array brackets and quotes in search params', () => {
    const result = routerSearch.stringify({ iconName: ['far-credit-card'] })
    expect(result).toContain('iconName=["far-credit-card"]')
    expect(result).not.toContain('%5B')
  })

  it('decodes slashes in dataUrl only', () => {
    const url = 'https://cdn.jsdelivr.net/npm/pkg@1/dist/'
    const result = routerSearch.stringify({ dataUrl: url, f_q: 'healthcare/speciality' })
    expect(result).toContain(`dataUrl=${url}`)
    expect(result).toContain('f_q=healthcare%2Fspeciality')
  })
})

describe('routerSearch.parse', () => {
  it('round-trips JSON search params', () => {
    const search = { locale: 'de', dataUrl: 'https://example.com/dist/' }
    const encoded = routerSearch.stringify(search)
    const query = encoded.startsWith('?') ? encoded.slice(1) : encoded
    expect(routerSearch.parse(query)).toEqual(search)
  })
})
